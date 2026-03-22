"use client";

/**
 * QUAL-01: Replaced all `any` types in MarkdownComponents with proper types
 * from react-markdown's Components interface. The `node` prop is no longer
 * needed (it was unused in every handler) so it is simply omitted — the
 * rest of the props spread correctly onto the HTML elements via
 * React.ComponentPropsWithoutRef.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { GeminiMessage } from "@/lib/gemini";
import ChatAvatarIcon from "@/components/icons/ChatAvatarIcon";

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

// ─── Markdown component overrides ─────────────────────────────────────────────
// QUAL-01: typed via react-markdown's Components interface.
// The `node` prop (ExtraProps["node"]) is available but unused here, so we
// simply don't destructure it — TypeScript is satisfied by the spread.

const MarkdownComponents: Components = {
  ul: ({ ...props }) => (
    <ul style={{ margin: "8px 0", paddingLeft: "24px", listStyleType: "disc" }} {...props} />
  ),
  ol: ({ ...props }) => (
    <ol style={{ margin: "8px 0", paddingLeft: "24px", listStyleType: "decimal" }} {...props} />
  ),
  li: ({ ...props }) => (
    <li style={{ margin: "4px 0", lineHeight: "1.5" }} {...props} />
  ),
  h1: ({ ...props }) => (
    <h1 style={{ margin: "12px 0 6px 0", fontSize: "18px", fontWeight: 600, color: "var(--text)" }} {...props} />
  ),
  h2: ({ ...props }) => (
    <h2 style={{ margin: "12px 0 6px 0", fontSize: "16px", fontWeight: 600, color: "var(--text)" }} {...props} />
  ),
  h3: ({ ...props }) => (
    <h3 style={{ margin: "12px 0 6px 0", fontSize: "14px", fontWeight: 600, color: "var(--text)" }} {...props} />
  ),
  p: ({ ...props }) => (
    <p style={{ margin: "0 0 8px 0", lineHeight: "1.5" }} {...props} />
  ),
  strong: ({ ...props }) => (
    <strong style={{ color: "var(--text)", fontWeight: 500 }} {...props} />
  ),
  // `code` receives an `inline` prop in older react-markdown versions; in v9+
  // block code is rendered via `pre` > `code`. We handle both cases here by
  // checking whether a `pre` parent is present via className convention.
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className); // block code has a language-* className
    if (!isBlock) {
      return (
        <code
          style={{
            background: "rgba(255,255,255,0.06)",
            padding: "2px 4px",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre style={{ background: "rgba(255,255,255,0.06)", padding: "8px 12px", borderRadius: "8px", overflowX: "auto", margin: "8px 0" }}>
        <code className={className} style={{ background: "none", padding: 0 }} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  a: ({ ...props }) => (
    <a style={{ color: "var(--green)", textDecoration: "none" }} target="_blank" rel="noopener noreferrer" {...props} />
  ),
  blockquote: ({ ...props }) => (
    <blockquote style={{ borderLeft: "2px solid var(--green)", paddingLeft: "12px", margin: "8px 0", color: "var(--text-dim)" }} {...props} />
  ),
};

/**
 * Renders Markdown content safely with custom components.
 */
function BotMessage({ text }: { text: string }) {
  return (
    <div className="chat-bot-message">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
  const [isOpen,         setIsOpen]         = useState(false);
  const [isExpanded,     setIsExpanded]     = useState(false);
  const [messages,       setMessages]       = useState<Message[]>(INITIAL_MESSAGES);
  const [input,          setInput]          = useState("");
  const [isLoading,      setIsLoading]      = useState(false);
  const [showSuggestions,setShowSuggestions]= useState(true);
  const [showDot,        setShowDot]        = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

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

  // Listen for the custom "open-chat" event dispatched by TrustBar
  useEffect(() => {
    function handleOpenChat() {
      setIsOpen(true);
      setShowDot(false);
    }
    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  }, []);

  function togglePanel() {
    setIsOpen((prev) => !prev);
    setShowDot(false);
    if (isOpen) setIsExpanded(false);
  }

  function toggleExpand() {
    setIsExpanded((prev) => !prev);
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
        const history = toGeminiHistory([...messages, { role: "user", text: trimmed }]);
        const historyWithoutLast = history.slice(0, -1);

        const res = await fetch("/api/chat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ message: trimmed, history: historyWithoutLast }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error desconocido");

        setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: err instanceof Error
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
        className={`chat-panel${isOpen ? " chat-panel--open" : ""}${isExpanded ? " chat-panel--expanded" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Asistente virtual de Gustavo Torres"
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-avatar" aria-hidden="true">
            <ChatAvatarIcon size={22} />
          </div>
          <div className="chat-header-info">
            <div className="chat-header-name">Asistente de Gustavo</div>
            <div className="chat-header-status">En línea · respuesta inmediata</div>
          </div>
          <div className="chat-header-actions">
            <button
              className="chat-expand-btn"
              onClick={toggleExpand}
              aria-label={isExpanded ? "Reducir ventana" : "Expandir ventana"}
              title={isExpanded ? "Reducir" : "Expandir"}
            >
              {isExpanded ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )}
            </button>
            <button
              className="chat-close-btn"
              onClick={togglePanel}
              aria-label="Cerrar chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
              {msg.role === "bot" ? <BotMessage text={msg.text} /> : msg.text}
            </div>
          ))}

          {isLoading && (
            <div className="chat-typing" aria-label="El asistente está escribiendo">
              <span /><span /><span />
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0d0f10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        {showDot && !isOpen && <div className="chat-fab-dot" aria-hidden="true" />}

        <svg className="chat-fab-icon-chat" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d0f10" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        <svg className="chat-fab-icon-close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d0f10" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </>
  );
}
