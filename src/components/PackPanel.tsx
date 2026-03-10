"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Badge } from "@/components/ui";
import { COLORS, PACK_CONFIG } from "@/constants";
import type { PackSize } from "@/types";

// ─── JS-based breakpoint hook ─────────────────────────────────────────────────
// Using matchMedia instead of CSS classes means DevTools device emulation
// (which resizes the actual viewport) works correctly alongside real devices.

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PackPanelProps {
  size: PackSize;
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onBuy: () => void;
}

const FEATURES = [
  { icon: "📅", text: "Reserva cada clase cuando quieras" },
  { icon: "🗓️", text: "Horarios en tiempo real vía Google Calendar" },
  { icon: "⏳", text: "Válido 6 meses desde la compra" },
  { icon: "💳", text: "Pago único con Stripe, sin suscripción" },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────

export default function PackPanel({ size, isOpen, anchorRef, onClose, onBuy }: PackPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pack = PACK_CONFIG[size];
  const isMobile = useIsMobile();

  // Outside-click handler (desktop only — mobile uses backdrop tap)
  useEffect(() => {
    if (!isOpen || isMobile) return;

    function onOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }

    const id = setTimeout(() => window.addEventListener("mousedown", onOutside), 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener("mousedown", onOutside);
    };
  }, [isOpen, isMobile, onClose, anchorRef]);

  if (!isOpen) return null;

  // ── Mobile: bottom sheet ──
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="w-full rounded-t-2xl"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            animation: "slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <PanelContent pack={pack} onClose={onClose} onBuy={onBuy} isMobile />
        </div>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ── Desktop: anchored popup ──
  const getPopupStyle = (): React.CSSProperties => {
    if (!anchorRef.current) return {};
    const rect = anchorRef.current.getBoundingClientRect();
    return {
      position: "fixed",
      top: rect.top,
      right: window.innerWidth - rect.left + 8,
      zIndex: 9999,
    };
  };

  return (
    <div
      ref={panelRef}
      style={{
        ...getPopupStyle(),
        width: "300px",
        backgroundColor: COLORS.surface,
        border: pack.featured
          ? `1.5px solid ${COLORS.brand}`
          : `1px solid ${COLORS.border}`,
        borderRadius: "16px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        animation: "packPanelIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        transformOrigin: "top right",
        overflow: "hidden",
      }}
    >
      <Arrow featured={pack.featured} />
      <PanelContent pack={pack} onClose={onClose} onBuy={onBuy} />

      <style>{`
        @keyframes packPanelIn {
          from { opacity: 0; transform: scale(0.92) translateX(8px); }
          to   { opacity: 1; transform: scale(1)    translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Arrow decoration (desktop only) ─────────────────────────────────────────

function Arrow({ featured }: { featured?: boolean }) {
  return (
    <>
      <div
        style={{
          position: "absolute", right: "-7px", top: "14px",
          width: "12px", height: "12px",
          backgroundColor: featured ? COLORS.brand : COLORS.border,
          transform: "rotate(45deg)",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute", right: "-6px", top: "15px",
          width: "10px", height: "10px",
          backgroundColor: COLORS.surface,
          transform: "rotate(45deg)",
          zIndex: 2,
        }}
      />
    </>
  );
}

// ─── Shared panel content ─────────────────────────────────────────────────────

function PanelContent({
  pack,
  onClose,
  onBuy,
  isMobile = false,
}: {
  pack: (typeof PACK_CONFIG)[PackSize];
  onClose: () => void;
  onBuy: () => void;
  isMobile?: boolean;
}) {
  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Badge row */}
      <div className="flex items-center justify-between">
        <Badge>{pack.badge}</Badge>
        {pack.featured && !isMobile && (
          <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>
            ✦ Más popular
          </span>
        )}
        {isMobile && (
          <div className="flex items-center gap-3">
            {pack.featured && (
              <span className="text-xs font-semibold" style={{ color: COLORS.warning }}>
                ✦ Más popular
              </span>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: COLORS.border, color: COLORS.textSecondary }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Price */}
      <div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">{pack.price}</span>
          <span className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>
            pago único
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm" style={{ color: COLORS.textSecondary }}>
            {pack.size} clases · {pack.perClass}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: COLORS.brand, backgroundColor: COLORS.brandMuted }}
          >
            {pack.savings}
          </span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}` }} />

      {/* Features */}
      <ul className="space-y-2">
        {FEATURES.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5" aria-hidden="true">{f.icon}</span>
            <span style={{ color: COLORS.textBody }}>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant="primary"
        fullWidth
        onClick={() => { onClose(); onBuy(); }}
        aria-label={`Comprar Pack ${pack.size} clases por ${pack.price}`}
      >
        Comprar Pack {pack.size} — {pack.price}
      </Button>

      <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>
        🔒 Pago seguro con Stripe
      </p>
    </div>
  );
}
