"use client";

interface SessionCardProps {
  badge?: string;
  name: string;
  duration: string;
  price: string;
  isFree?: boolean;
  featured?: boolean;
  /** Vertical layout for 3-column grid */
  vertical?: boolean;
  onClick: () => void;
}

export default function SessionCard({
  badge,
  name,
  duration,
  price,
  isFree = false,
  featured = false,
  vertical = false,
  onClick,
}: SessionCardProps) {
  if (vertical) {
    return (
      <button
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "28px 24px",
          background: featured ? "rgba(78,222,163,0.07)" : "#1c1b1d",
          border: featured
            ? "1px solid rgba(78,222,163,0.3)"
            : "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          cursor: "pointer",
          textAlign: "left",
          transition: "border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s",
          fontFamily: "inherit",
          position: "relative",
          overflow: "hidden",
          transform: featured ? "scale(1.03)" : "scale(1)",
          boxShadow: featured ? "0 16px 48px rgba(78,222,163,0.12)" : "none",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = featured
            ? "rgba(78,222,163,0.55)"
            : "rgba(78,222,163,0.25)";
          el.style.background = featured
            ? "rgba(78,222,163,0.12)"
            : "#201f22";
          el.style.transform = featured ? "scale(1.05)" : "translateY(-2px)";
          el.style.boxShadow = featured
            ? "0 20px 56px rgba(78,222,163,0.2)"
            : "0 8px 24px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = featured
            ? "rgba(78,222,163,0.3)"
            : "rgba(255,255,255,0.06)";
          el.style.background = featured ? "rgba(78,222,163,0.07)" : "#1c1b1d";
          el.style.transform = featured ? "scale(1.03)" : "scale(1)";
          el.style.boxShadow = featured ? "0 16px 48px rgba(78,222,163,0.12)" : "none";
        }}
      >
        {/* Badge */}
        {badge && (
          <span
            style={{
              display: "inline-block",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: "100px",
              marginBottom: "20px",
              background: featured ? "rgba(78,222,163,0.15)" : "rgba(255,255,255,0.06)",
              color: featured ? "#4edea3" : "#bbcabf",
              border: featured
                ? "1px solid rgba(78,222,163,0.25)"
                : "1px solid rgba(255,255,255,0.1)",
              alignSelf: "flex-start",
            }}
          >
            {badge}
          </span>
        )}
        {!badge && <div style={{ height: 28, marginBottom: 8 }} />}

        {/* Name */}
        <div
          style={{
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#e5e1e4",
            marginBottom: "8px",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
          }}
        >
          {name}
        </div>

        {/* Duration */}
        <div style={{ fontSize: "0.8rem", color: "#86948a", lineHeight: 1.5, flex: 1, marginBottom: "24px" }}>
          {duration}
        </div>

        {/* Price + arrow */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontFamily: "var(--font-headline, Manrope), sans-serif",
              fontSize: isFree ? "1rem" : "1.75rem",
              fontWeight: 800,
              color: "#4edea3",
              letterSpacing: isFree ? "0" : "-0.03em",
              lineHeight: 1,
            }}
          >
            {price}
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: featured ? "rgba(78,222,163,0.15)" : "rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4edea3" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </div>
      </button>
    );
  }

  // ── Horizontal layout (original) ──────────────────────────────────────────
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "20px 24px",
        marginBottom: "10px",
        background: featured ? "rgba(78,222,163,0.06)" : "#2a2a2c",
        border: featured
          ? "1px solid rgba(78,222,163,0.25)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "10px",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.2s, background 0.2s, transform 0.15s",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = featured ? "rgba(78,222,163,0.5)" : "rgba(78,222,163,0.2)";
        el.style.background = featured ? "rgba(78,222,163,0.1)" : "#353437";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = featured ? "rgba(78,222,163,0.25)" : "rgba(255,255,255,0.06)";
        el.style.background = featured ? "rgba(78,222,163,0.06)" : "#2a2a2c";
        el.style.transform = "translateY(0)";
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {badge && (
          <span
            style={{
              display: "inline-block",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: "100px",
              marginBottom: "8px",
              background: "rgba(78,222,163,0.12)",
              color: "#4edea3",
              border: "1px solid rgba(78,222,163,0.2)",
            }}
          >
            {badge}
          </span>
        )}
        <div
          style={{
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            fontSize: "15px",
            fontWeight: 700,
            color: "#e5e1e4",
            marginBottom: "4px",
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: "12.5px", color: "#86948a" }}>{duration}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, marginLeft: "16px" }}>
        <div
          style={{
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            fontSize: isFree ? "13px" : "18px",
            fontWeight: 800,
            color: "#4edea3",
            letterSpacing: isFree ? "0" : "-0.02em",
          }}
        >
          {price}
        </div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: featured ? "rgba(78,222,163,0.15)" : "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4edea3" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    </button>
  );
}
