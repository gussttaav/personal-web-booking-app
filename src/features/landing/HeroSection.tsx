"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "100px",
        paddingBottom: "80px",
        animation: "fadeUp 0.7s ease both",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* ── Profile image with glow ── */}
        <div
          style={{
            position: "relative",
            marginBottom: "40px",
          }}
        >
          {/* Glow ring */}
          <div
            style={{
              position: "absolute",
              inset: -6,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(78,222,163,0.25) 0%, transparent 70%)",
              filter: "blur(8px)",
              opacity: 0.8,
            }}
          />
          <div
            style={{
              position: "relative",
              width: 140,
              height: 140,
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid rgba(78,222,163,0.3)",
              boxShadow: "0 0 0 1px rgba(78,222,163,0.15), 0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <Image
              src="/avatar.jpg"
              alt="Gustavo Torres Guerrero"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        </div>

        {/* ── Identity ── */}
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#4edea3",
              marginBottom: "8px",
            }}
          >
            Gustavo Torres Guerrero
          </p>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#86948a",
              fontWeight: 400,
            }}
          >
            MSc. Matemáticas y Computación
          </p>
        </div>

        {/* ── Headline ── */}
        <h1
          style={{
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            fontSize: "clamp(2.4rem, 6vw, 4.25rem)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#e5e1e4",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
              fontWeight: 400,
              color: "#bbcabf",
              letterSpacing: "-0.01em",
              marginBottom: "16px",
            }}
          >
            Profesor de Programación, Matemáticas &amp; IA · Consultor
          </span>
          Domina la tecnología con{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #4edea3, #10b981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            mentoría de alto nivel
          </span>
        </h1>

        {/* ── Subtitle ── */}
        <div style={{ maxWidth: "640px", marginBottom: "40px" }}>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.7,
              color: "#e5e1e4",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Acompañamiento personalizado para desbloquear tu potencial técnico.
          </p>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "#bbcabf" }}>
            Especialista en ingeniería de software, fundamentos matemáticos rigurosos y despliegue
            estratégico de IA para estudiantes de grado y profesionales.
          </p>
        </div>

        {/* ── CTAs ── */}
        <div
          className="hero-cta-row"
          style={{
            justifyContent: "center",
            gap: "16px",
            marginBottom: "56px",
          }}
        >
          <a
            href="#sessions"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px 36px",
              background: "linear-gradient(135deg, #4edea3, #10b981)",
              color: "#003824",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              fontFamily: "var(--font-headline, Manrope), sans-serif",
              boxShadow: "0 8px 32px rgba(78,222,163,0.25)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(78,222,163,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(78,222,163,0.25)";
            }}
          >
            Reservar sesión ahora
          </a>

          <a
            href="#sessions"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "16px 36px",
              background: "#2a2a2c",
              color: "#e5e1e4",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
              fontFamily: "var(--font-headline, Manrope), sans-serif",
              border: "1px solid rgba(60,74,66,0.5)",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#353437";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(60,74,66,0.8)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#2a2a2c";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(60,74,66,0.5)";
            }}
          >
            Ver disponibilidad
          </a>
        </div>

        {/* ── Stats bar ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "48px",
            paddingTop: "32px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            width: "100%",
          }}
        >
          {[
            { value: "15+", label: "Años de experiencia" },
            { value: "500+", label: "Estudiantes ayudados" },
            { value: "4.9", label: "Valoración media" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-headline, Manrope), sans-serif",
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#4edea3",
                  lineHeight: 1,
                  marginBottom: "6px",
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
      </div>
    </section>
  );
}
