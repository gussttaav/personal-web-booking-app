"use client";

/**
 * PackCard — Emerald Nocturne reskin
 *
 * Props interface: IDENTICAL to original — no logic changes.
 * Visual: matches the pack pricing cards in landing.html.
 *   - "Recomendado" ribbon on 10h pack
 *   - Tonal surface stacking (no hard borders on base, ghost border on featured)
 *   - Price in Manrope black
 */

import type { PackSize } from "@/types";

interface PackCardProps {
  size: PackSize;
  price: string;
  discount: string;
  recommended?: boolean;
  onClick: () => void;
}

export default function PackCard({
  size,
  price,
  discount,
  recommended = false,
  onClick,
}: PackCardProps) {
  const features =
    size === 10
      ? [
          "Ahorro de hasta el 20%",
          "Canal privado Slack/Discord",
          "Vigencia de 180 días",
        ]
      : [
          "Ahorra sobre precio base",
          "Vigencia de 180 días",
        ];

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        padding: "28px",
        background: recommended ? "rgba(78,222,163,0.05)" : "#201f22",
        border: recommended
          ? "1px solid rgba(78,222,163,0.25)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.2s, background 0.2s, transform 0.15s",
        fontFamily: "inherit",
        overflow: "hidden",
        marginBottom: "12px",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = recommended
          ? "rgba(78,222,163,0.5)"
          : "rgba(78,222,163,0.2)";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = recommended
          ? "rgba(78,222,163,0.25)"
          : "rgba(255,255,255,0.06)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Recommended ribbon */}
      {recommended && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            padding: "4px 10px",
            background: "#4edea3",
            color: "#003824",
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            borderBottomLeftRadius: "8px",
          }}
        >
          Recomendado
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "6px",
          paddingRight: recommended ? "80px" : "0",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "#e5e1e4",
            letterSpacing: "-0.01em",
          }}
        >
          Pack {size} Horas
        </div>
        <div
          style={{
            fontFamily: "var(--font-headline, Manrope), sans-serif",
            fontSize: "26px",
            fontWeight: 800,
            color: "#4edea3",
            letterSpacing: "-0.02em",
          }}
        >
          {price}
        </div>
      </div>

      {/* Discount label */}
      <p
        style={{
          fontSize: "12px",
          color: "#bbcabf",
          marginBottom: "18px",
        }}
      >
        {discount}
      </p>

      {/* Feature list */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
        {features.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              color: "#bbcabf",
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "rgba(78,222,163,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4edea3" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            {f}
          </li>
        ))}
      </ul>
    </button>
  );
}
