"use client";

/**
 * BiographySection — Case B: element from old site, not present in new design.
 *
 * Placed between HeroSection and the booking shell.
 * Styled to match the Emerald Nocturne design system:
 *   - surface-container-low background (tonal, no hard border)
 *   - Manrope headlines, Inter body
 *   - Generous whitespace ("Breath of Luxury")
 *   - Skills grid with icon tags
 *
 * Content is drawn from the chat-prompt.ts profile (single source of truth).
 * This is a Server Component — zero JS shipped.
 */

export default function BiographySection() {
  return (
    <section
      style={{
        marginBottom: "48px",
        padding: "48px 32px",
        background: "#1c1b1d",  /* surface-container-low — tonal lift, no border */
        borderRadius: "12px",
        animation: "fadeUp 0.7s ease both 0.15s",
      }}
    >
      {/* ── Over-line ── */}
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#4edea3",
          marginBottom: "12px",
        }}
      >
        Sobre Gustavo
      </p>

      {/* ── Headline ── */}
      <h2
        style={{
          fontFamily: "var(--font-headline, Manrope), sans-serif",
          fontSize: "clamp(1.4rem, 4vw, 2rem)",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "#e5e1e4",
          marginBottom: "20px",
          lineHeight: 1.2,
        }}
      >
        Ingeniero, matemático y profesor con más de 15 años de trayectoria
      </h2>

      {/* ── Bio paragraphs ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "#bbcabf" }}>
          Licenciado en Ciencias de la Computación por la Universidad de Oriente y Máster en
          Matemáticas y Computación por la Universidad de Cantabria (beca Fundación Carolina).
          Nacido en Cuba, residente en España desde 2018 y con nacionalidad española.
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "#bbcabf" }}>
          Ha trabajado como desarrollador de software, investigador científico, profesor
          universitario y consultor tecnológico. Desde 2020 se dedica exclusivamente a la
          enseñanza y consultoría independiente, ayudando a estudiantes universitarios,
          profesionales en reconversión y empresas a dominar programación, matemáticas e
          inteligencia artificial.
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.75, color: "#bbcabf" }}>
          Imparte clases en español e inglés (nivel C1 certificado) por Google Meet, sin
          intermediarios ni comisiones de plataforma. Más de 500 estudiantes han pasado
          por sus sesiones con una valoración media de 4.9/5.
        </p>
      </div>

      {/* ── Social links ── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <a
          href="https://github.com/gussttaav"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#bbcabf",
            textDecoration: "none",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(78,222,163,0.3)";
            (e.currentTarget as HTMLElement).style.color = "#4edea3";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.color = "#bbcabf";
          }}
        >
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/gustavo-torres-guerrero"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#bbcabf",
            textDecoration: "none",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(78,222,163,0.3)";
            (e.currentTarget as HTMLElement).style.color = "#4edea3";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.color = "#bbcabf";
          }}
        >
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          LinkedIn
        </a>
        <a
          href="mailto:contacto@gustavoai.dev"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#bbcabf",
            textDecoration: "none",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(78,222,163,0.3)";
            (e.currentTarget as HTMLElement).style.color = "#4edea3";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.color = "#bbcabf";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          contacto@gustavoai.dev
        </a>
      </div>
    </section>
  );
}
