"use client";

interface SessionCardProps {
  badge?: string;
  name: string;
  duration: string;
  price: string;
  isFree?: boolean;
  featured?: boolean;
  onClick: () => void;
}

export default function SessionCard({
  badge,
  name,
  duration,
  price,
  isFree = false,
  featured = false,
  onClick,
}: SessionCardProps) {
  return (
    <button
      onClick={onClick}
      className="session-card w-full text-left"
      data-featured={featured || undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 20px",
        background: featured ? "rgba(61,220,132,0.06)" : "var(--surface)",
        border: featured ? "1px solid rgba(61,220,132,0.25)" : "1px solid var(--border)",
        borderRadius: "var(--radius)",
        marginBottom: 10,
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = featured
          ? "rgba(61,220,132,0.5)"
          : "rgba(255,255,255,0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = featured
          ? "rgba(61,220,132,0.25)"
          : "var(--border)";
      }}
    >
      <div style={{ minWidth: 0 }}>
        {badge && (
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 500,
              marginBottom: 5,
              background: featured ? "rgba(61,220,132,0.2)" : "rgba(255,255,255,0.06)",
              color: featured ? "var(--green)" : "var(--text-muted)",
              border: featured ? "1px solid rgba(61,220,132,0.3)" : "1px solid var(--border)",
            }}
          >
            {badge}
          </span>
        )}
        <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
          {name}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{duration}</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          flexShrink: 0,
          marginLeft: 16,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 500, color: isFree ? "var(--green)" : "var(--text)" }}>
          {price}
        </span>
        <span style={{ fontSize: 18, color: "var(--text-muted)" }}>→</span>
      </div>
    </button>
  );
}
