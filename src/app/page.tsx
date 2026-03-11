"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useUserSession } from "@/hooks/useUserSession";
import { usePackPanel } from "@/hooks/usePackPanel";
import { useStickyButtons } from "@/hooks/useStickyButtons";
import SpeedDial from "@/components/SpeedDial";
import PackModal from "@/components/PackModal";
import PackPanel from "@/components/PackPanel";
import BookingModeView from "@/components/BookingModeView";
import { Spinner } from "@/components/ui";
import { COLORS, getCalLink, PACK_SIZES } from "@/constants";
import type { PackSize, StudentInfo } from "@/types";

const CalComBooking = dynamic(() => import("@/components/CalComBooking"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center gap-3" style={{ height: "580px" }}>
      <Spinner />
      <p className="text-sm" style={{ color: COLORS.textSecondary }}>Cargando calendario...</p>
    </div>
  ),
});

const CAL_LINK = getCalLink(process.env.NEXT_PUBLIC_CAL_URL);
const CAL_EVENT_LINK = getCalLink(
  process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ??
    `${process.env.NEXT_PUBLIC_CAL_URL ?? "https://cal.com/gustavo-torres"}/pack-1-hora`
);

// ─── Page ─────────────────────────────────────────────────────────────────────

function HomeContent() {
  const { session, startSession, updateCredits, clearSession } = useUserSession();
  const {
    dialOpen, activePanel,
    toggleDial, closeDial,
    togglePanel, closePanel,
    btn5Ref, btn10Ref,
  } = usePackPanel();
  const { cardRef, isSticky, fixedRight, fixedTop } = useStickyButtons(16);
  const [selectedPack, setSelectedPack] = useState<PackSize | null>(null);

  // Ref to the SpeedDial container DOM node
  const dialContainerRef = useRef<HTMLDivElement>(null);
  // Ref to whichever PackPanel is currently open — populated via onPanelRef callback
  const activePanelRef = useRef<HTMLDivElement | null>(null);

  const itemRefs: Record<PackSize, React.RefObject<HTMLButtonElement>> = {
    5:  btn5Ref  as React.RefObject<HTMLButtonElement>,
    10: btn10Ref as React.RefObject<HTMLButtonElement>,
  };

  // ── Single outside-click handler for the whole dial+panel system ──
  // Uses 'click' (not 'mousedown') so it always fires AFTER button onClick.
  useEffect(() => {
    if (!dialOpen) return;

    function onOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideDial   = dialContainerRef.current?.contains(target) ?? false;
      const insidePanel  = activePanelRef.current?.contains(target) ?? false;
      if (!insideDial && !insidePanel) {
        closeDial();
      }
    }

    window.addEventListener("click", onOutside);
    return () => window.removeEventListener("click", onOutside);
  }, [dialOpen, closeDial]);

  function handleCreditsReady(student: StudentInfo) {
    closeDial();
    setSelectedPack(null);
    startSession(student);
  }

  const dialContainerStyle: React.CSSProperties = isSticky
    ? { position: "fixed", top: fixedTop, right: fixedRight, zIndex: 50 }
    : { position: "absolute", top: "12px", right: "12px", zIndex: 20 };

  const calDimmed = dialOpen || !!activePanel;

  return (
    <main className="min-h-screen" style={{ backgroundColor: COLORS.background }}>

      {/* ── Header ── */}
      <header
        className="border-b py-4 sm:py-5 px-4"
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
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
        <div
          ref={cardRef}
          className="rounded-2xl overflow-visible relative"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            minHeight: "580px",
          }}
        >
          {!session && (
            <>
              {/* Speed dial */}
              <SpeedDial
                containerRef={dialContainerRef}
                isOpen={dialOpen}
                activePanel={activePanel}
                itemRefs={itemRefs}
                onToggleDial={toggleDial}
                onTogglePanel={togglePanel}
                onClose={closeDial}
                containerStyle={dialContainerStyle}
              />

              {/* Calendar */}
              <div style={{
                opacity: calDimmed ? 0.3 : 1,
                transition: "opacity 0.3s ease",
                pointerEvents: calDimmed ? "none" : "auto",
              }}>
                <CalComBooking calLink={CAL_LINK} theme="dark" brandColor={COLORS.brand} />
              </div>

              {/* Pack detail panels */}
              {PACK_SIZES.map((size) => (
                <PackPanel
                  key={size}
                  size={size}
                  isOpen={activePanel === size}
                  anchorRef={itemRefs[size]}
                  onClose={closePanel}
                  onPanelRef={(el) => { activePanelRef.current = el; }}
                  onBuy={() => {
                    setSelectedPack(size);
                    // Defer dial close so it never races with setSelectedPack in the same render
                    setTimeout(closeDial, 0);
                  }}
                />
              ))}
            </>
          )}

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

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
          <Spinner />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
