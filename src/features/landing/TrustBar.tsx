"use client";

/**
 * TrustBar — Emerald Nocturne reskin
 *
 * Replaces the old trust bar with updated tokens and layout matching landing.html footer's
 * trust section. Shown below the interactive booking shell.
 */

export default function TrustBar() {
  return (
    <section
      style={{
        marginTop: "48px",
        paddingTop: "32px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        animation: "fadeUp 0.6s ease both 0.9s",
      }}
    >
      {/* ── Label ── */}
      <p
        style={{
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#86948a",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        Pagos procesados de forma segura
      </p>

      {/* ── Trust logos ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          opacity: 0.45,
          filter: "grayscale(1)",
          transition: "opacity 0.4s, filter 0.4s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.8";
          (e.currentTarget as HTMLElement).style.filter = "grayscale(0)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.45";
          (e.currentTarget as HTMLElement).style.filter = "grayscale(1)";
        }}
      >
        {/* Stripe wordmark SVG (inline — avoids external image permission issues) */}
        <svg height="20" viewBox="0 0 60 25" fill="#e5e1e4" aria-label="Stripe">
          <path d="M5.45 9.55C5.45 8.36 6.43 7.9 8.06 7.9c2.31 0 4.61.7 6.48 1.95V3.29C12.7 2.44 10.24 2 7.84 2 3.21 2 0 4.42 0 9.83c0 8.37 11.53 7.03 11.53 10.64 0 1.41-1.22 1.87-2.93 1.87-2.53 0-5.76-.9-8.31-2.46v6.69C2.64 27.32 5.37 28 8.1 28c4.78 0 8.08-2.37 8.08-7.84-.02-9.04-10.73-7.45-10.73-10.61zM27.13 2.41l-4.3.92V7h-3.1v5.3h3.1v10c0 4.38 2.07 6.25 6.43 6.25 1.51 0 3.28-.23 4.54-.78v-5.18c-.93.4-2.13.62-3.17.62-1.33 0-3.5-.42-3.5-2.72V12.3h6.67V7h-6.67V2.41zm12.5 7.9c-1.98 0-3.29.93-4.01 1.58l-.27-1.27h-5.1v25.02l5.78-1.23V29.3c.75.54 1.85 1.3 3.67 1.3 3.71 0 7.09-2.98 7.09-9.56-.02-6-3.43-10.73-7.16-10.73zm-1.26 16.11c-1.22 0-1.94-.43-2.44-.96V17.4c.54-.58 1.28-1 2.44-1 1.87 0 3.16 2.09 3.16 5.02 0 3.01-1.27 5.0-3.16 5.0zM54.3 7h-5.84v21.28h5.84V7zM51.4 0c-1.87 0-3.37 1.5-3.37 3.37 0 1.87 1.5 3.37 3.37 3.37 1.87 0 3.37-1.5 3.37-3.37C54.77 1.5 53.27 0 51.4 0z"/>
        </svg>

        {/* Visa */}
        <svg height="16" viewBox="0 0 60 20" fill="#e5e1e4" aria-label="Visa">
          <path d="M26.9 1.1L24.5 18.9H20.3L22.7 1.1H26.9ZM44.9 12.7L47.2 6.2L48.5 12.7H44.9ZM49.7 18.9H53.7L50.2 1.1H46.6C45.8 1.1 45.1 1.6 44.8 2.3L38.4 18.9H42.7L43.6 16.3H48.9L49.7 18.9ZM38.9 13.3C38.9 9 32.7 8.8 32.8 6.9C32.8 6.3 33.3 5.7 34.6 5.5C35.2 5.4 36.9 5.3 38.8 6.2L39.6 2.4C38.6 2 37.3 1.7 35.7 1.7C31.7 1.7 28.9 3.9 28.9 7.1C28.9 9.4 31 10.7 32.5 11.4C34.1 12.2 34.6 12.7 34.6 13.4C34.6 14.4 33.4 14.9 32.4 14.9C30.3 14.9 29.1 14.3 28.1 13.8L27.3 17.7C28.3 18.2 30.1 18.6 32 18.6C36.3 18.6 39 16.4 39 12.9L38.9 13.3ZM21.3 1.1L14.7 18.9H10.3L7.1 4.3C6.9 3.4 6.7 3 6 2.7C4.9 2.1 3 1.6 1.4 1.3L1.5 1.1H8.8C9.7 1.1 10.5 1.7 10.7 2.7L12.4 12.2L16.7 1.1H21.3Z"/>
        </svg>

        {/* Mastercard */}
        <svg height="22" viewBox="0 0 38 24" aria-label="Mastercard">
          <rect width="15" height="24" x="0" y="0" fill="#e5e1e4" rx="2"/>
          <rect width="15" height="24" x="23" y="0" fill="#bbcabf" rx="2"/>
          <path fill="#e5e1e4" d="M19 4.3a10 10 0 0 1 0 15.4A10 10 0 0 1 19 4.3z"/>
        </svg>
      </div>

      {/* ── Meta info ── */}
      <div
        style={{
          marginTop: "24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "center",
        }}
      >
        {[
          { icon: "🔒", text: "Pago 100% seguro con Stripe" },
          { icon: "↩️", text: "Cancelación hasta 2h antes" },
          { icon: "📧", text: "Confirmación inmediata por email" },
        ].map((item) => (
          <div
            key={item.text}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#86948a" }}
          >
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
