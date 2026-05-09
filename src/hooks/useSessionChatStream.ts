"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/app/api/chat-session/route";

export interface UseSessionChatStream {
  messages:     ChatMessage[];
  send:         (text: string) => Promise<void>;
  lastIncoming: ChatMessage | null;
}

// Single owner of the live-session chat SSE. Returns the message list, a send
// helper, and `lastIncoming` (set every time a NON-self message arrives) so
// callers can react to incoming messages (e.g., badge + ding) without opening
// a parallel EventSource. Self detection is by `senderEmail` — the server uses
// `session.user.email` as the sender identity, which matches the email
// available client-side via `useSession()`.
export function useSessionChatStream(
  eventId:   string,
  userEmail: string | undefined,
  enabled:   boolean,
): UseSessionChatStream {
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [lastIncoming, setLastIncoming] = useState<ChatMessage | null>(null);
  const seenIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) return;
    const url = `/api/chat-session?eventId=${encodeURIComponent(eventId)}`;
    const es  = new EventSource(url);
    es.addEventListener("message", (e: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(e.data) as ChatMessage;
        if (seenIdsRef.current.has(msg.id)) return;
        seenIdsRef.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
        if (userEmail && msg.senderEmail !== userEmail) {
          setLastIncoming(msg);
        }
      } catch { /* malformed — ignore */ }
    });
    return () => { es.close(); };
  }, [enabled, eventId, userEmail]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await fetch("/api/chat-session", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ eventId, text: trimmed }),
    });
  }, [eventId]);

  return { messages, send, lastIncoming };
}
