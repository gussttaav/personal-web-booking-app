"use client";

/**
 * SessionCard — Emerald Nocturne reskin
 *
 * Props interface: IDENTICAL to original — no logic changes.
 * Visual: matches landing.html session card style.
 *   - surface-container-high card, no explicit border (tonal stacking)
 *   - Ghost border via outline-variant at low opacity
 *   - Primary CTA gradient on featured card
 *   - Manrope label, Inter body
 */

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
        el.style.borderColor = featured
          ? "rgba(78,222,163,0.5)"
          : "rgba(78,222,163,0.2)";
        el.style.background = featured
          ? "rgba(78,222,163,0.1)"
          : "#353437";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = featured
          ? "rgba(78,222,163,0.25)"
          : "rgba(255,255,255,0.06)";
        el.style.background = featured ? "rgba(78,222,163,0.06)" : "#2a2a2c";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Left: info */}
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
              background: isFree
                ? "rgba(78,222,163,0.12)"
                : "rgba(78,222,163,0.12)",
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

      {/* Right: price + arrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
          marginLeft: "16px",
        }}
      >
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4edea3"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    </button>
  );
}
