"use client";

/**
 * Footer — Emerald Nocturne redesign
 *
 * Extracted from landing.html footer section.
 * Includes: brand, policy links, help links, trust badges, FooterModals trigger.
 *
 * FooterModals (policy modals) are still used — they're client components that
 * the user can trigger; we just pass the modal open state down from here via
 * the FooterModals wrapper (unchanged from original).
 */

import FooterModals from "@/features/landing/FooterModals";

export default function Footer() {
  return (
    <footer
      style={{
        width: "100%",
        paddingTop: "64px",
        paddingBottom: "40px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "#0e0e10",
        marginTop: "80px",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
        {/* ── Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "48px",
            marginBottom: "48px",
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-headline, Manrope), sans-serif",
                fontSize: "1.1rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#e5e1e4",
                marginBottom: "16px",
              }}
            >
              GUSTAVOAI.DEV
            </div>
            <p style={{ fontSize: "13px", color: "#86948a", lineHeight: 1.65, marginBottom: "20px" }}>
              Ingeniería de precisión en educación profesional y académica.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href="https://www.linkedin.com/in/gustavo-torres-guerrero"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  background: "#201f22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#86948a",
                  transition: "color 0.15s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4edea3")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#86948a")}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href="https://github.com/gussttaav"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  background: "#201f22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#86948a",
                  transition: "color 0.15s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4edea3")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#86948a")}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Políticas */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-headline, Manrope), sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#e5e1e4",
                marginBottom: "20px",
              }}
            >
              Políticas
            </h4>
            {/* FooterModals handles the modal triggers — unchanged component */}
            <FooterModals />
          </div>

          {/* Ayuda */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-headline, Manrope), sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: "#e5e1e4",
                marginBottom: "20px",
              }}
            >
              Ayuda
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href="mailto:contacto@gustavoai.dev"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  color: "#86948a",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4edea3")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#86948a")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                contacto@gustavoai.dev
              </a>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event("open-chat"));
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  color: "#86948a",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  padding: 0,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#4edea3")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#86948a")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#4edea3" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Pregunta al asistente IA
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new Event("open-chat"));
                  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                }}
                style={{
                  display: "inline-block",
                  alignSelf: "flex-start",
                  fontSize: "11px",
                  color: "#4edea3",
                  padding: "2px 10px",
                  border: "1px solid rgba(78,222,163,0.25)",
                  borderRadius: "100px",
                  background: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(78,222,163,0.08)";
                  el.style.borderColor = "rgba(78,222,163,0.5)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "none";
                  el.style.borderColor = "rgba(78,222,163,0.25)";
                }}
              >
                FAQs al instante
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          style={{
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(134,148,138,0.5)",
            }}
          >
            © {new Date().getFullYear()} Gustavo Torres Guerrero. Todos los derechos reservados.
          </div>

          {/* Payment security + card logos */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", opacity: 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingRight: "16px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#86948a" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#86948a", whiteSpace: "nowrap" }}>
                Pago seguro · Stripe
              </span>
            </div>
            {/* Visa */}
            <div style={{ padding: "3px 7px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", background: "rgba(255,255,255,0.02)" }}>
              <svg height="11" viewBox="0 0 60 20" fill="#e5e1e4" aria-label="Visa">
                <path d="M26.9 1.1L24.5 18.9H20.3L22.7 1.1H26.9ZM44.9 12.7L47.2 6.2L48.5 12.7H44.9ZM49.7 18.9H53.7L50.2 1.1H46.6C45.8 1.1 45.1 1.6 44.8 2.3L38.4 18.9H42.7L43.6 16.3H48.9L49.7 18.9ZM38.9 13.3C38.9 9 32.7 8.8 32.8 6.9C32.8 6.3 33.3 5.7 34.6 5.5C35.2 5.4 36.9 5.3 38.8 6.2L39.6 2.4C38.6 2 37.3 1.7 35.7 1.7C31.7 1.7 28.9 3.9 28.9 7.1C28.9 9.4 31 10.7 32.5 11.4C34.1 12.2 34.6 12.7 34.6 13.4C34.6 14.4 33.4 14.9 32.4 14.9C30.3 14.9 29.1 14.3 28.1 13.8L27.3 17.7C28.3 18.2 30.1 18.6 32 18.6C36.3 18.6 39 16.4 39 12.9L38.9 13.3ZM21.3 1.1L14.7 18.9H10.3L7.1 4.3C6.9 3.4 6.7 3 6 2.7C4.9 2.1 3 1.6 1.4 1.3L1.5 1.1H8.8C9.7 1.1 10.5 1.7 10.7 2.7L12.4 12.2L16.7 1.1H21.3Z"/>
              </svg>
            </div>
            {/* Mastercard */}
            <div style={{ padding: "3px 7px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", background: "rgba(255,255,255,0.02)" }}>
              <svg height="16" viewBox="0 0 38 24" aria-label="Mastercard">
                <rect width="15" height="24" x="0" y="0" fill="#e5e1e4" rx="2"/>
                <rect width="15" height="24" x="23" y="0" fill="#bbcabf" rx="2"/>
                <path fill="#e5e1e4" d="M19 4.3a10 10 0 0 1 0 15.4A10 10 0 0 1 19 4.3z"/>
              </svg>
            </div>
            {/* Amex */}
            <div style={{ padding: "3px 7px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.05em", color: "#e5e1e4", fontFamily: "var(--font-headline, Manrope), sans-serif" }}>AMEX</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
