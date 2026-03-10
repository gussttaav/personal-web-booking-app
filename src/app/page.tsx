"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { useUserSession } from "@/hooks/useUserSession";
import { usePackPanel } from "@/hooks/usePackPanel";
import { useStickyButtons } from "@/hooks/useStickyButtons";
import PackModal from "@/components/PackModal";
import PackPanel from "@/components/PackPanel";
import BookingModeView from "@/components/BookingModeView";
import { Spinner } from "@/components/ui";
import { COLORS, getCalLink, PACK_CONFIG, PACK_SIZES } from "@/constants";
import type { PackSize, StudentInfo } from "@/types";

const CalComBooking = dynamic(() => import("@/components/CalComBooking"), {
  ssr: false,
  loading: () => (
    <div
      className="flex flex-col items-center justify-center gap-3"
      style={{ height: "580px" }}
    >
      <Spinner />
      <p className="text-sm" style={{ color: COLORS.textSecondary }}>
        Cargando calendario...
      </p>
    </div>
  ),
});

// ─── Derived config ───────────────────────────────────────────────────────────

const CAL_LINK = getCalLink(process.env.NEXT_PUBLIC_CAL_URL);
const CAL_EVENT_LINK = getCalLink(
  process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ??
    `${process.env.NEXT_PUBLIC_CAL_URL ?? "https://cal.com/gustavo-torres"}/pack-1-hora`
);

// ─── Page ─────────────────────────────────────────────────────────────────────

function HomeContent() {
  const { session, startSession, updateCredits, clearSession } = useUserSession();
  const { activePanel, togglePanel, closePanel, btn5Ref, btn10Ref } = usePackPanel();
  const { cardRef, isSticky, fixedRight, fixedTop } = useStickyButtons(16);
  const [selectedPack, setSelectedPack] = useState<PackSize | null>(null);

  const btnRefs: Record<PackSize, React.RefObject<HTMLButtonElement>> = {
    5: btn5Ref as React.RefObject<HTMLButtonElement>,
    10: btn10Ref as React.RefObject<HTMLButtonElement>,
  };

  function handleCreditsReady(student: StudentInfo) {
    setSelectedPack(null);
    closePanel();
    startSession(student);
  }

  // Button container style: absolute inside card until card scrolls out of
  // view, then fixed to the viewport at the same right-edge alignment.
  const buttonContainerStyle: React.CSSProperties = isSticky
    ? {
        position: "fixed",
        top: fixedTop,
        right: fixedRight,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }
    : {
        position: "absolute",
        top: "12px",
        right: "12px",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      };

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* ── Header ── */}
      <header
        className="border-b py-4 sm:py-5 px-4"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              Gustavo Torres Guerrero
            </h1>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              Profesor y consultor independiente
            </p>
          </div>

          {session && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs truncate max-w-[120px] sm:max-w-none" style={{ color: COLORS.textSecondary }}>
                Hola, {session.name}
              </p>
              <p className="text-lg font-bold" style={{ color: COLORS.brand }}>
                {session.credits} clase{session.credits !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Card — ref tracked for sticky button calculation */}
        <div
          ref={cardRef}
          className="rounded-2xl overflow-visible relative"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            minHeight: "580px",
          }}
        >
          {/* ── Calendar / Browse mode ── */}
          {!session && (
            <>
              {/* Pack buttons — absolute inside card normally,
                  switches to fixed once card top scrolls off screen */}
              <div style={buttonContainerStyle} aria-label="Packs disponibles">
                {PACK_SIZES.map((size) => {
                  const pack = PACK_CONFIG[size];
                  return (
                    <PackButton
                      key={size}
                      size={size}
                      pack={pack}
                      isActive={activePanel === size}
                      btnRef={btnRefs[size]}
                      onToggle={() => togglePanel(size)}
                    />
                  );
                })}
              </div>

              {/* Calendar (dimmed when a panel is open) */}
              <div
                style={{
                  opacity: activePanel ? 0.3 : 1,
                  transition: "opacity 0.3s ease",
                  pointerEvents: activePanel ? "none" : "auto",
                }}
              >
                <CalComBooking
                  calLink={CAL_LINK}
                  theme="dark"
                  brandColor={COLORS.brand}
                />
              </div>

              {/* Pack panels */}
              {PACK_SIZES.map((size) => (
                <PackPanel
                  key={size}
                  size={size}
                  isOpen={activePanel === size}
                  anchorRef={btnRefs[size]}
                  onClose={closePanel}
                  onBuy={() => {
                    closePanel();
                    setSelectedPack(size);
                  }}
                />
              ))}
            </>
          )}

          {/* ── Booking mode ── */}
          {session && (
            <BookingModeView
              student={session}
              calLink={CAL_EVENT_LINK}
              onCreditsUpdated={updateCredits}
              onExit={clearSession}
            />
          )}
        </div>
      </div>

      {/* Pack purchase modal */}
      {selectedPack && (
        <PackModal
          packSize={selectedPack}
          onClose={() => setSelectedPack(null)}
          onCreditsReady={handleCreditsReady}
        />
      )}
    </main>
  );
}

// ─── Pack button ──────────────────────────────────────────────────────────────

interface PackButtonProps {
  size: PackSize;
  pack: (typeof PACK_CONFIG)[PackSize];
  isActive: boolean;
  btnRef: React.RefObject<HTMLButtonElement>;
  onToggle: () => void;
}

function PackButton({ size, pack, isActive, btnRef, onToggle }: PackButtonProps) {
  return (
    <button
      ref={btnRef}
      onClick={onToggle}
      aria-expanded={isActive}
      aria-haspopup="true"
      aria-label={`Ver pack ${size} clases — ${pack.price}`}
      className="relative flex flex-col items-center justify-center transition-all duration-200"
      style={{
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        border: `1.5px solid ${COLORS.brand}`,
        backgroundColor: isActive ? COLORS.brandMuted : "transparent",
        color: COLORS.brand,
        boxShadow: isActive
          ? `0 0 20px rgba(24,210,110,0.5), inset 0 0 12px rgba(24,210,110,0.25)`
          : `0 3px 12px rgba(0,0,0,0.5)`,
        backdropFilter: "blur(2px)",
      }}
    >
      <span style={{ fontSize: "18px", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.5px" }}>
        {size}h
      </span>
      <span style={{ fontSize: "8px", fontWeight: 300, opacity: 0.8, marginTop: "2px" }}>
        {pack.price}
      </span>
      {isActive && (
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{
            backgroundColor: COLORS.brand,
            boxShadow: `0 0 8px ${COLORS.brand}`,
          }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: COLORS.background }}
        >
          <Spinner />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
