"use client";

import { PACK_CONFIG } from "@/constants";
import type { PackSize } from "@/types";

interface PackCardProps {
  size: PackSize;
  activeCredits: number | null;
  creditsLoading: boolean;
  onBuy: (size: PackSize) => void;
  onSchedule: () => void;
}

export default function PackCard({
  size,
  activeCredits,
  creditsLoading,
  onBuy,
  onSchedule,
}: PackCardProps) {
  const pack = PACK_CONFIG[size];
  const isPopular = pack.featured;
  const hasCredits = !creditsLoading && activeCredits !== null && activeCredits > 0;

  return (
    <div
      style={{
        flex: "1 1 200px",
        padding: "22px 20px",
        background: isPopular ? "rgba(61,220,132,0.06)" : "var(--surface)",
        border: isPopular ? "1px solid rgba(61,220,132,0.3)" : "1px solid var(--border)",
        borderRadius: "var(--radius)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: isPopular ? "var(--green)" : "var(--text-muted)",
          marginBottom: 12,
          display: "block",
        }}
      >
        {pack.badge}
      </span>

      <div
        style={{
          fontFamily: "var(--font-serif), 'DM Serif Display', serif",
          fontSize: 34,
          color: "var(--text)",
          lineHeight: 1,
          marginBottom: 2,
        }}
      >
        {size}h
      </div>

      {hasCredits ? (
        <div style={{ fontSize: 12, marginBottom: 14 }}>
          <span style={{ color: "var(--green)", fontWeight: 500 }}>
            {activeCredits} clase{activeCredits !== 1 ? "s" : ""} disponible
            {activeCredits !== 1 ? "s" : ""}
          </span>
          <span style={{ color: "var(--text-muted)" }}> · {pack.perClass}</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          {size} clases · {pack.perClass}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 500, color: "var(--text)" }}>{pack.price}</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>pago único</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 500, marginBottom: 16 }}>
        {pack.savings}
      </div>

      <button
        onClick={() => (hasCredits ? onSchedule() : onBuy(size))}
        style={{
          display: "block",
          width: "100%",
          padding: "10px",
          borderRadius: 8,
          border: isPopular || hasCredits ? "1px solid var(--green)" : "1px solid var(--border)",
          background: isPopular || hasCredits ? "var(--green)" : "transparent",
          color: isPopular || hasCredits ? "#0d0f10" : "var(--text-muted)",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s",
          marginTop: "auto",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.background = "var(--green)";
          btn.style.borderColor = "var(--green)";
          btn.style.color = "#0d0f10";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (isPopular || hasCredits) {
            btn.style.background = "var(--green)";
            btn.style.borderColor = "var(--green)";
            btn.style.color = "#0d0f10";
          } else {
            btn.style.background = "transparent";
            btn.style.borderColor = "var(--border)";
            btn.style.color = "var(--text-muted)";
          }
        }}
      >
        {hasCredits ? `Reservar clase` : `Comprar pack · ${pack.price}`}
      </button>
    </div>
  );
}
