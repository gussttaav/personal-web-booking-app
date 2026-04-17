/**
 * POST /api/chat
 *
 * Applied fixes:
 *   SEC-04: CSRF protection — Origin header must match NEXT_PUBLIC_BASE_URL
 */

import { NextRequest, NextResponse } from "next/server";
import { chat, type GeminiMessage } from "@/lib/gemini";
import { CHAT_SYSTEM_PROMPT } from "@/constants/chat-prompt";
import { chatRatelimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/ip-utils";
import { log } from "@/lib/logger";
import { isValidOrigin } from "@/lib/csrf";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_TURNS  = 10;

function isValidHistory(value: unknown): value is GeminiMessage[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      (item.role === "user" || item.role === "model") &&
      Array.isArray(item.parts) &&
      item.parts.length === 1 &&
      typeof item.parts[0]?.text === "string"
  );
}

export async function POST(req: NextRequest) {
  // ── CSRF ───────────────────────────────────────────────────────────────────
  if (!isValidOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const { success } = await chatRatelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Espera un momento e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de petición inválido" }, { status: 400 });
  }

  const { message, history } = body as Record<string, unknown>;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Mensaje demasiado largo" }, { status: 400 });
  }
  if (!isValidHistory(history)) {
    return NextResponse.json({ error: "Historial de conversación inválido" }, { status: 400 });
  }

  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);

  try {
    const reply = await chat(CHAT_SYSTEM_PROMPT, trimmedHistory, message.trim());
    return NextResponse.json({ reply });
  } catch (err) {
    log("error", "Gemini API error", { service: "chat", error: String(err) });
    return NextResponse.json(
      { error: "Error al contactar con el asistente. Inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
