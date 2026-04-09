/**
 * POST /api/zoom/end
 *
 * Expires a Zoom Video SDK session by removing its Redis record so no new
 * JWTs can be issued for it. Protected by X-Internal-Secret header.
 *
 * Called automatically by the webhook after durationWithGrace minutes,
 * or manually by the tutor if needed.
 *
 * NOTE: The Zoom Video SDK does not expose a REST endpoint to forcefully
 * terminate an in-progress session using SDK Key/Secret credentials —
 * that requires Server-to-Server OAuth (a separate Zoom app type). Removing
 * the Redis record is sufficient: the JWT TTL (1 hour) ensures no new tokens
 * are issued, and the Zoom room closes naturally once all participants leave
 * or the JWT expires. A TODO for future: add S2S OAuth to hard-terminate.
 */

import { NextRequest, NextResponse } from "next/server";
import { kv } from "@/lib/redis";
import type { ZoomSessionRecord } from "@/lib/zoom";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Internal secret guard ──────────────────────────────────────────────────
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let eventId: string;
  try {
    const body = await req.json() as { eventId?: unknown };
    if (typeof body.eventId !== "string" || !body.eventId) {
      throw new Error("missing eventId");
    }
    eventId = body.eventId;
  } catch {
    return NextResponse.json({ error: "Se requiere eventId" }, { status: 400 });
  }

  // ── Look up Zoom session record ────────────────────────────────────────────
  const record = await kv.get<ZoomSessionRecord>(`zoom:session:${eventId}`);
  if (!record) {
    // Already expired or never existed — idempotent success
    return NextResponse.json({ ok: true, note: "session not found (already expired)" });
  }

  // ── Remove Redis record so no new JWTs can be issued ──────────────────────
  await kv.del(`zoom:session:${eventId}`);

  log("info", "Zoom session record expired", {
    service: "zoom", eventId, sessionName: record.sessionName,
  });

  return NextResponse.json({ ok: true });
}
