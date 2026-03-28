"use client";

/**
 * PackCard — Emerald Nocturne reskin
 *
 * Props interface: restored to full original — includes active state (activeCredits,
 * creditsLoading, onSchedule) plus Emerald Nocturne visual tokens.
 *
 * Active state: green background/border + "Pack activo" ribbon + credits count
 * + "Reservar clase" CTA when user has credits for this specific pack size.
 */

import type { PackSize } from "@/types";

interface PackCardProps {
  size: PackSize;
  price: string;
  discount: string;
  recommended?: boolean;
  activeCredits: number | null;
  creditsLoading: boolean;
  onClick: () => void;
  onSchedule: () => void;
}

export default function PackCard({
  size,
  price,
  discount,
  recommended = false,
  activeCredits,
  creditsLoading,
  onClick,
  onSchedule,
}: PackCardProps) {
  const features =
    size === 10
      ? ["Ahorro de hasta el 20%", "Canal privado Slack/Discord", "Vigencia de 180 días"]
      : ["Ahorra sobre precio base", "Vigencia de 180 días"];

  const hasCredits = !creditsLoading && activeCredits !== null && activeCredits > 0;
  const isHighlighted = hasCredits || recommended;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        padding: "28px",
        background: hasCredits
          ? "rgba(78,222,163,0.07)"
          : recommended
          ? "rgba(78,222,163,0.05)"
          : "#201f22",
        border: isHighlighted
          ? "1px solid rgba(78,222,163,0.35)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "12px",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isHighlighted
          ? "rgba(78,222,163,0.55)"
          : "rgba(78,222,163,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isHighlighted
          ? "rgba(78,222,163,0.35)"
          : "rgba(255,255,255,0.06)";
      }}
    >
      {/* Top-right ribbon */}
      {(hasCredits || recommended) && (
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
          {hasCredits ? "Pack activo" : "Recomendado"}
        </div>
      )}

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "6px",
          paddingRight: isHighlighted ? "84px" : "0",
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

      {/* Credits or discount subtitle */}
      {creditsLoading ? (
        <div
          style={{
            height: "16px",
            width: "130px",
            borderRadius: "4px",
            background: "#2a2a2c",
            marginBottom: "18px",
            animation: "skeletonPulse 1.4s ease-in-out infinite",
          }}
        />
      ) : hasCredits ? (
        <div style={{ fontSize: "12px", marginBottom: "18px" }}>
          <span style={{ color: "#4edea3", fontWeight: 600 }}>
            {activeCredits} clase{activeCredits !== 1 ? "s" : ""} disponible
            {activeCredits !== 1 ? "s" : ""}
          </span>
          <span style={{ color: "#86948a" }}> · pendiente{activeCredits !== 1 ? "s" : ""} de reservar</span>
        </div>
      ) : (
        <p style={{ fontSize: "12px", color: "#bbcabf", marginBottom: "18px" }}>
          {discount}
        </p>
      )}

      {/* Feature list */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {features.map((f) => (
          <li
            key={f}
            style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#bbcabf" }}
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
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4edea3"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        onClick={hasCredits ? onSchedule : onClick}
        style={{
          display: "block",
          width: "100%",
          padding: "11px",
          borderRadius: "8px",
          border: isHighlighted
            ? "1px solid rgba(78,222,163,0.5)"
            : "1px solid rgba(60,74,66,0.4)",
          background: isHighlighted ? "linear-gradient(135deg, #4edea3, #10b981)" : "transparent",
          color: isHighlighted ? "#003824" : "#bbcabf",
          fontFamily: "var(--font-headline, Manrope), sans-serif",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          transition: "filter 0.15s, background 0.15s, border-color 0.15s, color 0.15s",
          letterSpacing: "0.01em",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (isHighlighted) {
            btn.style.filter = "brightness(1.08)";
          } else {
            btn.style.background = "rgba(78,222,163,0.06)";
            btn.style.borderColor = "rgba(78,222,163,0.4)";
            btn.style.color = "#4edea3";
          }
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (isHighlighted) {
            btn.style.filter = "brightness(1)";
          } else {
            btn.style.background = "transparent";
            btn.style.borderColor = "rgba(60,74,66,0.4)";
            btn.style.color = "#bbcabf";
          }
        }}
      >
        {hasCredits ? "Reservar clase" : `Comprar pack · ${price}`}
      </button>
    </div>
  );
}
