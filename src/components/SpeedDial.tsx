"use client";

import { COLORS, PACK_CONFIG, PACK_SIZES } from "@/constants";
import type { PackSize } from "@/types";

interface SpeedDialProps {
  /** DOM ref owned by the parent — used for outside-click detection */
  containerRef: React.RefObject<HTMLDivElement>;
  isOpen: boolean;
  activePanel: PackSize | null;
  itemRefs: Record<PackSize, React.RefObject<HTMLButtonElement>>;
  onToggleDial: () => void;
  onTogglePanel: (size: PackSize) => void;
  onClose: () => void;
  containerStyle?: React.CSSProperties;
}

export default function SpeedDial({
  containerRef,
  isOpen,
  activePanel,
  itemRefs,
  onToggleDial,
  onTogglePanel,
  containerStyle,
}: SpeedDialProps) {
  // Outside-click is handled by the parent (page.tsx) using 'click' event,
  // which always fires after onClick — so onBuy in PackPanel always runs first.

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        ...containerStyle,
      }}
      aria-label="Packs disponibles"
    >
      {/* ── 1. Trigger — always on top ── */}
      <button
        onClick={onToggleDial}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Cerrar packs" : "Ver packs de clases"}
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          border: `1.5px solid ${COLORS.brand}`,
          backgroundColor: isOpen ? COLORS.brand : "transparent",
          color: isOpen ? COLORS.background : COLORS.brand,
          boxShadow: isOpen
            ? `0 0 24px rgba(24,210,110,0.5)`
            : `0 4px 14px rgba(0,0,0,0.5)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          backdropFilter: "blur(4px)",
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: "24px",
            fontWeight: 300,
            lineHeight: 1,
            display: "block",
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          +
        </span>
      </button>

      {/* ── 2. Pack items — expand below the trigger ── */}
      {PACK_SIZES.map((size, i) => {
        const pack = PACK_CONFIG[size];
        const isActive = activePanel === size;

        return (
          <div
            key={size}
            style={{
              overflow: "hidden",
              height: isOpen ? "52px" : "0px",
              opacity: isOpen ? 1 : 0,
              marginTop: isOpen ? "0px" : "-10px",
              pointerEvents: isOpen ? "auto" : "none",
              transition: `height 0.2s ease ${i * 50}ms,
                           opacity 0.2s ease ${i * 50}ms,
                           margin-top 0.2s ease ${i * 50}ms`,
            }}
          >
            <button
              ref={itemRefs[size]}
              onClick={() => onTogglePanel(size)}
              aria-expanded={isActive}
              aria-haspopup="true"
              aria-label={`Ver pack ${size} clases — ${pack.price}`}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                border: `1.5px solid ${isActive ? COLORS.brand : COLORS.border}`,
                backgroundColor: isActive ? COLORS.brandMuted : COLORS.surface,
                color: isActive ? COLORS.brand : COLORS.textSecondary,
                boxShadow: isActive
                  ? `0 0 20px rgba(24,210,110,0.4), inset 0 0 10px rgba(24,210,110,0.2)`
                  : `0 4px 14px rgba(0,0,0,0.5)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "border-color 0.2s, background-color 0.2s, color 0.2s, box-shadow 0.2s",
                backdropFilter: "blur(4px)",
                position: "relative",
              }}
            >
              <span style={{ fontSize: "17px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.5px" }}>
                {size}h
              </span>
              <span style={{ fontSize: "8px", fontWeight: 400, opacity: 0.75, marginTop: "2px" }}>
                {pack.price}
              </span>
              {isActive && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "-4px", right: "-4px",
                    width: "10px", height: "10px",
                    borderRadius: "50%",
                    backgroundColor: COLORS.brand,
                    boxShadow: `0 0 8px ${COLORS.brand}`,
                    border: `2px solid ${COLORS.background}`,
                  }}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
