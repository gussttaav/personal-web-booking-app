"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import type { GeminiMessage } from "@/lib/gemini";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "bot";
  text: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    role: "bot",
    text: "¡Hola! 👋 Soy el asistente de **Gustavo Torres**. Puedo contarte sobre sus clases, áreas de especialidad, cómo reservar una sesión o cualquier otra duda.",
  },
  { role: "bot", text: "¿En qué puedo ayudarte?" },
];

const SUGGESTIONS = [
  "¿Qué asignaturas impartes?",
  "¿Cómo reservo una sesión?",
  "¿Qué incluye el pack?",
  "¿Das clases en inglés?",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts our display messages to the Gemini history format.
 * The initial bot messages are excluded — they are not real AI turns.
 */
function toGeminiHistory(messages: Message[]): GeminiMessage[] {
  return messages
    .filter((_, i) => i >= INITIAL_MESSAGES.length) // skip greeting
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));
}

/**
 * Renders simple markdown-like formatting in bot messages.
 * Only handles **bold** — safe, no dangerouslySetInnerHTML needed.
 */
function BotText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showDot, setShowDot] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 220);
    }
  }, [isOpen]);

  function togglePanel() {
    setIsOpen((prev) => !prev);
    setShowDot(false);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setShowSuggestions(false);
      setInput("");
      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setIsLoading(true);

      try {
        const history = toGeminiHistory([
          ...messages,
          { role: "user", text: trimmed },
        ]);
        // Remove the last user message from history since API receives it separately
        const historyWithoutLast = history.slice(0, -1);

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history: historyWithoutLast }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Error desconocido");
        }

        setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text:
              err instanceof Error
                ? err.message
                : "Ha ocurrido un error. Por favor, inténtalo de nuevo.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* ── Chat panel ── */}
      <div
        className={`chat-panel${isOpen ? " chat-panel--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Asistente virtual de Gustavo Torres"
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-avatar" aria-hidden="true">
            🤖
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">Asistente de Gustavo</div>
            <div className="chat-header-status">En línea · respuesta inmediata</div>
          </div>
          <button
            className="chat-close-btn"
            onClick={togglePanel}
            aria-label="Cerrar chat"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg chat-msg--${msg.role}`}
            >
              {msg.role === "bot" ? <BotText text={msg.text} /> : msg.text}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="chat-typing" aria-label="El asistente está escribiendo">
              <span />
              <span />
              <span />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="chat-suggestion"
                onClick={() => sendMessage(s)}
                disabled={isLoading}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            className="chat-input"
            type="text"
            placeholder="Escribe tu pregunta…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={1000}
            aria-label="Escribe tu mensaje"
          />
          <button
            className="chat-send"
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensaje"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0d0f10"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── FAB ── */}
      <button
        className={`chat-fab${isOpen ? " chat-fab--open" : ""}`}
        onClick={togglePanel}
        aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={isOpen}
      >
        {/* Unread dot */}
        {showDot && !isOpen && (
          <div className="chat-fab-dot" aria-hidden="true" />
        )}

        {/* Chat icon */}
        <svg
          className="chat-fab-icon-chat"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0d0f10"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        {/* Close icon */}
        <svg
          className="chat-fab-icon-close"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0d0f10"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </>
  );
}
