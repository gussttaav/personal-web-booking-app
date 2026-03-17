export default function TrustBar() {
  const items = [
    "📅 Horarios en tiempo real vía Google Calendar",
    "🔒 Pago seguro con Stripe",
    "↩️ Sin suscripciones",
  ];

  return (
    <>
      <div
        style={{
          marginTop: 40,
          padding: "20px 24px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          flexWrap: "wrap",
          animation: "fadeUp 0.6s ease both 0.65s",
        }}
      >
        {items.map((item, i) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                color: "var(--text-muted)",
              }}
            >
              {item}
            </span>
            {i < items.length - 1 && (
              <div
                aria-hidden="true"
                style={{ width: 4, height: 4, background: "var(--text-dim)", borderRadius: "50%" }}
              />
            )}
          </div>
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-dim)",
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        🔐 Pagos procesados de forma segura por Stripe
      </p>
    </>
  );
}
