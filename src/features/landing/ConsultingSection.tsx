const FEATURES = [
  {
    title: "Implantación y automatización con IA",
    desc: "Diseño e integración de agentes y flujos inteligentes adaptados a tus procesos de negocio.",
  },
  {
    title: "Análisis de datos y toma de decisiones",
    desc: "Extracción de valor de tus datos para apoyar decisiones estratégicas con base estadística.",
  },
  {
    title: "Formación técnica para equipos",
    desc: "Programación, arquitectura de software, IA y buenas prácticas. Adaptado al nivel y stack de tu equipo.",
  },
  {
    title: "Arquitectura y revisión de sistemas",
    desc: "Auditoría y rediseño de backends, APIs y microservicios para mejorar escalabilidad y mantenibilidad.",
  },
];

export default function ConsultingSection() {
  return (
    <section style={{ animation: "fadeUp 0.7s ease both 0.25s" }}>
      {/* Section label */}
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#4edea3",
          marginBottom: "10px",
        }}
      >
        Servicios para empresas
      </p>

      {/* Main card */}
      <div
        style={{
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid rgba(78,222,163,0.2)",
          background: "linear-gradient(135deg, rgba(78,222,163,0.08) 0%, rgba(16,185,129,0.04) 100%)",
          position: "relative",
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(78,222,163,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ padding: "48px", position: "relative", zIndex: 1 }}>
          {/* Top: headline + CTA */}
          <div className="consulting-top" style={{ marginBottom: "48px" }}>
            <div style={{ maxWidth: "560px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-headline, Manrope), sans-serif",
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  color: "#e5e1e4",
                  lineHeight: 1.15,
                  marginBottom: "16px",
                }}
              >
                Consultoría para{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #4edea3, #10b981)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Empresas
                </span>
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.7,
                  color: "#bbcabf",
                  margin: 0,
                }}
              >
                Integra inteligencia artificial en tus procesos, forma a tu equipo técnico e
                implementa soluciones que generen impacto real en tu organización.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0 }}>
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 28px",
                  background: "linear-gradient(135deg, #4edea3, #10b981)",
                  color: "#003824",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-headline, Manrope), sans-serif",
                  letterSpacing: "0.02em",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(78,222,163,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                Solicitar información
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <p style={{ fontSize: "11px", color: "#86948a", textAlign: "center", margin: 0 }}>
                Sin compromiso · Respuesta en 24h
              </p>
            </div>
          </div>

          {/* Feature grid */}
          <div className="consulting-features">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                style={{
                  background: "rgba(19,19,21,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px",
                  padding: "22px",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    background: "rgba(78,222,163,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4edea3" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-headline, Manrope), sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "#e5e1e4",
                    marginBottom: "6px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {feature.title}
                </div>
                <p style={{ fontSize: "0.875rem", color: "#86948a", lineHeight: 1.65, margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
