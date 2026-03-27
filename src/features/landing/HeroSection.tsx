"use client";

/**
 * HeroSection — Emerald Nocturne redesign
 *
 * Matches landing.html hero section exactly, with the addition of:
 *   - Avatar / profile photo
 *   - Stat bar (years / students / rating)
 *
 * Replaced: old DM Serif Display title + DM Sans body
 * New:      Manrope headline + Inter body per DESIGN.md
 */

export default function HeroSection() {
  return (
    <section
      style={{ paddingTop: "140px", paddingBottom: "80px", animation: "fadeUp 0.7s ease both" }}
    >
      {/* ── Over-line badge ── */}
      <div style={{ marginBottom: "24px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            background: "rgba(78,222,163,0.1)",
            border: "1px solid rgba(78,222,163,0.2)",
            borderRadius: "100px",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#4edea3",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4edea3", display: "inline-block", flexShrink: 0 }} />
          Disponible para nuevos estudiantes
        </span>
      </div>

      {/* ── Headline ── */}
      <h1
        style={{
          fontFamily: "var(--font-headline, Manrope), sans-serif",
          fontSize: "clamp(2.4rem, 6vw, 3.5rem)",
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "#e5e1e4",
          marginBottom: "20px",
          maxWidth: "580px",
        }}
      >
        Domina la tecnología con{" "}
        <span
          style={{
            background: "linear-gradient(135deg, #4edea3, #10b981)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          precisión de ingeniero
        </span>
      </h1>

      {/* ── Subtitle ── */}
      <p
        style={{
          fontSize: "1rem",
          lineHeight: 1.7,
          color: "#bbcabf",
          marginBottom: "36px",
          maxWidth: "520px",
        }}
      >
        Profesor y consultor en programación, matemáticas e IA. Más de 15 años de experiencia
        transformando conceptos complejos en conocimiento accionable.
      </p>

      {/* ── CTA Row ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "48px" }}>
        <a
          href="#sessions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 28px",
            background: "linear-gradient(135deg, #4edea3, #10b981)",
            color: "#003824",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            letterSpacing: "0.02em",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 8px 32px rgba(78,222,163,0.25)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(78,222,163,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(78,222,163,0.25)";
          }}
        >
          Reservar sesión gratuita
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>

        <a
          href="#sessions"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 28px",
            background: "rgba(255,255,255,0.03)",
            color: "#e5e1e4",
            borderRadius: "6px",
            fontWeight: 600,
            fontSize: "0.9rem",
            textDecoration: "none",
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            border: "1px solid rgba(255,255,255,0.08)",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
          }}
        >
          Ver packs
        </a>
      </div>

      {/* ── Stats bar ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          paddingTop: "32px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {[
          { value: "15+", label: "Años de experiencia" },
          { value: "500+", label: "Estudiantes ayudados" },
          { value: "4.9", label: "Valoración media" },
        ].map((stat) => (
          <div key={stat.label}>
            <div
              style={{
                fontFamily: "var(--font-headline, Manrope), sans-serif",
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "#4edea3",
                lineHeight: 1,
                marginBottom: "4px",
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#86948a", letterSpacing: "0.04em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
