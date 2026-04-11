"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage } from "@/app/api/chat-session/route";

interface SessionChatProps {
  eventId:  string;
  userName: string;
  onClose:  () => void;
}

export default function SessionChat({ eventId, userName, onClose }: SessionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const cursorRef               = useRef(0);
  const esRef                   = useRef<EventSource | null>(null);

  // ── SSE connection — auto-reconnects via EventSource ──────────────────────
  useEffect(() => {
    function connect() {
      if (esRef.current) esRef.current.close();

      const url = `/api/chat-session?eventId=${encodeURIComponent(eventId)}`;
      const es  = new EventSource(url);
      esRef.current = es;

      es.addEventListener("message", (e: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(e.data) as ChatMessage;
          setMessages((prev) => {
            // Deduplicate by id (can arrive twice on reconnect if cursor lags)
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          cursorRef.current += 1;
        } catch {
          /* malformed message — ignore */
        }
      });

      // On error EventSource retries automatically; nothing to do here
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [eventId]);

  // ── Auto-scroll to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    try {
      await fetch("/api/chat-session", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventId, text }),
      });
    } catch {
      /* network error — message lost, non-fatal */
    } finally {
      setSending(false);
    }
  }, [eventId, input, sending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void send();
      }
    },
    [send]
  );

  return (
    <aside
      className="w-80 bg-surface-container-low/50 backdrop-blur-md rounded-2xl my-4 border border-white/5 flex flex-col gap-3 overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/5">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#4edea3]">
          Live Session Chat
        </h3>
        <button
          onClick={onClose}
          className="text-on-surface-variant hover:text-white"
          aria-label="Cerrar chat"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-4 min-h-0">
        {messages.length === 0 && (
          <p className="text-[10px] text-on-surface-variant/40 text-center mt-4">
            Todavía no hay mensajes. ¡Di hola!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-xs leading-relaxed">
            <span
              className="font-bold mr-1"
              style={{ color: msg.senderName === userName ? "#9ed2b5" : "#4edea3" }}
            >
              {msg.senderName}:
            </span>
            <span className="text-[#e5e1e4]/70">{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={sending}
            className="w-full bg-surface-container-lowest border-none rounded-xl text-xs py-2 px-3 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-[#4edea3]/50 focus:outline-none"
          />
        </div>
      </div>
    </aside>
  );
}
