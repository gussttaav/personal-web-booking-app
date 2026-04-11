/**
 * /api/chat-session
 *
 * POST — send a chat message scoped to a live Zoom session.
 * GET  — SSE stream of chat messages for a session.
 *
 * Redis schema:
 *   Key:  chat:session:{eventId}   (Redis list)
 *   Val:  JSON-serialised ChatMessage objects
 *   TTL:  86 400 s (24 h) — set on first push
 *
 * SSE resumption uses the standard `Last-Event-ID` header:
 *   - Each streamed message carries `id: {index}`.
 *   - On reconnect, EventSource sends `Last-Event-ID: {index}` automatically.
 *   - The server reads that header as the cursor and only sends newer messages.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { kv } from "@/lib/redis";
import { chatRatelimit } from "@/lib/ratelimit";
import type { ZoomSessionRecord } from "@/lib/zoom";

const CHAT_TTL_SEC   = 86_400; // 24 hours
const MAX_WAIT_MS    = 20_000; // stay under Vercel 25 s limit
const POLL_INTERVAL  = 1_500;

export interface ChatMessage {
  id:           string; // `{eventId}:{index}`
  senderEmail:  string;
  senderName:   string;
  text:         string;
  sentAt:       string; // ISO
}

export const dynamic = "force-dynamic";

// ─── POST /api/chat-session ────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Autenticación requerida" }, { status: 401 });
  }

  // Rate limit — 20 msgs/min per IP (reuses AI-chat limiter with distinct key)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await chatRatelimit.limit(`chat-session:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  // Parse body
  let eventId: string, text: string;
  try {
    const body = (await req.json()) as { eventId?: unknown; text?: unknown };
    if (typeof body.eventId !== "string" || !body.eventId) throw new Error("missing eventId");
    if (typeof body.text   !== "string" || !body.text.trim()) throw new Error("missing text");
    eventId = body.eventId;
    text    = body.text.trim().slice(0, 1000); // cap message length
  } catch {
    return NextResponse.json({ error: "eventId y text son requeridos" }, { status: 400 });
  }

  // Verify the eventId corresponds to an active Zoom session
  const zoomRecord = await kv.get<ZoomSessionRecord>(`zoom:session:${eventId}`);
  if (!zoomRecord) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  const listKey = `chat:session:${eventId}`;

  // Build message
  const currentLen = await kv.llen(listKey);
  const message: ChatMessage = {
    id:          `${eventId}:${currentLen}`,
    senderEmail: session.user.email,
    senderName:  session.user.name ?? session.user.email,
    text,
    sentAt:      new Date().toISOString(),
  };

  // Push to list; set TTL on first message
  await kv.rpush(listKey, JSON.stringify(message));
  if (currentLen === 0) {
    await kv.expire(listKey, CHAT_TTL_SEC);
  }

  return NextResponse.json({ ok: true });
}

// ─── GET /api/chat-session (SSE) ──────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<Response> {
  // Auth
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Authentication required", { status: 401 });
  }

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return new Response("Missing eventId", { status: 400 });
  }

  // Read cursor from Last-Event-ID header (standard SSE resumption) or default 0
  const lastEventId = req.headers.get("last-event-id");
  let cursor = lastEventId ? parseInt(lastEventId, 10) : 0;
  if (isNaN(cursor) || cursor < 0) cursor = 0;

  const listKey = `chat:session:${eventId}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendRaw(chunk: string) {
        controller.enqueue(encoder.encode(chunk));
      }

      // Heartbeat so the browser knows the connection is live
      sendRaw("event: connected\ndata: {}\n\n");

      // Flush any messages already in the list that the client hasn't seen
      const initialLen = await kv.llen(listKey);
      if (initialLen > cursor) {
        const rawMsgs = await kv.lrange<string>(listKey, cursor, initialLen - 1);
        for (let i = 0; i < rawMsgs.length; i++) {
          const idx  = cursor + i;
          const data = typeof rawMsgs[i] === "string" ? rawMsgs[i] : JSON.stringify(rawMsgs[i]);
          sendRaw(`id: ${idx}\nevent: message\ndata: ${data}\n\n`);
        }
        cursor = initialLen;
      }

      // Poll for new messages until MAX_WAIT_MS
      const deadline = Date.now() + MAX_WAIT_MS;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));

        try {
          const len = await kv.llen(listKey);
          if (len > cursor) {
            const rawMsgs = await kv.lrange<string>(listKey, cursor, len - 1);
            for (let i = 0; i < rawMsgs.length; i++) {
              const idx  = cursor + i;
              const data = typeof rawMsgs[i] === "string" ? rawMsgs[i] : JSON.stringify(rawMsgs[i]);
              sendRaw(`id: ${idx}\nevent: message\ndata: ${data}\n\n`);
            }
            cursor = len;
          }
        } catch {
          // Redis read failed — keep trying
        }
      }

      // Close after MAX_WAIT_MS; EventSource reconnects automatically with Last-Event-ID
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache, no-transform",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
