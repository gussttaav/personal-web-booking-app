"use client";

/**
 * InteractiveShell
 *
 * This is the **only** client boundary on the landing page.
 * It owns all booking/auth state and renders:
 *   - SignInGate modal
 *   - PackModal
 *   - SessionCard list (interactive buttons only)
 *   - PackCard list (interactive buttons only)
 *   - AuthCorner (fixed top-right)
 *   - Chat widget (fixed bottom-right)
 *
 * Everything above (HeroSection, TrustBar) is rendered as RSC by page.tsx
 * and never touches this bundle.
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUserSession } from "@/hooks/useUserSession";
import PackModal from "@/components/PackModal";
import BookingModeViewComponent from "@/components/BookingModeView";
import SignInGate from "@/components/SignInGate";
import SingleSessionBooking from "@/components/SingleSessionBooking";
import AuthCorner from "@/components/AuthCorner";
import Chat from "@/components/Chat";
import { CreditsPill } from "@/components/ui";
import { COLORS, PACK_SIZES } from "@/constants";
import SessionCard from "./SessionCard";
import PackCard from "./PackCard";
import type { PackSize, StudentInfo } from "@/types";
import type { SingleSessionType } from "@/components/SingleSessionBooking";

export default function InteractiveShell() {
  const {
    googleUser,
    isSignedIn,
    packSession,
    creditsLoading,
    updateCredits,
  } = useUserSession();

  const searchParams = useSearchParams();

  const packCreditsForSize = (size: PackSize): number | null => {
    if (packSession && packSession.credits > 0 && packSession.packSize === size) {
      return packSession.credits;
    }
    return null;
  };

  const [pendingSession,    setPendingSession]    = useState<SingleSessionType | null>(null);
  const [activeSession,     setActiveSession]     = useState<SingleSessionType | null>(null);
  const [showPackBooking,   setShowPackBooking]   = useState(false);
  const [selectedPack,      setSelectedPack]      = useState<PackSize | null>(null);
  const [signInGateLabel,   setSignInGateLabel]   = useState("");
  // When true the user reached 0 credits but still needs pack booking access
  // to cancel/reschedule existing sessions via email links
  const [forcePackBooking,  setForcePackBooking]  = useState(false);
  const [rescheduleToken,   setRescheduleToken]   = useState<string | null>(null);
  // Stores the reschedule intent when the user hits the link while logged out
  const [pendingReschedule, setPendingReschedule] = useState<{ type: string; token: string | null; callbackUrl: string } | null>(null);

  function handleCreditsReady(_student: StudentInfo) {
    setSelectedPack(null);
  }

  function handleSessionClick(type: SingleSessionType) {
    if (!isSignedIn) {
      const labels: Record<SingleSessionType, string> = {
        free15min: "reservar el encuentro inicial gratuito",
        session1h: "reservar una sesión de 1 hora",
        session2h: "reservar una sesión de 2 horas",
      };
      setPendingSession(type);
      setSignInGateLabel(labels[type]);
      return;
    }
    setActiveSession(type);
  }

  function handlePackBuy(size: PackSize) {
    if (!isSignedIn) {
      setPendingSession(null);
      setSignInGateLabel("comprar un pack de clases");
      setSelectedPack(size);
      return;
    }
    setSelectedPack(size);
  }

  function handlePackSchedule() {
    if (!isSignedIn) {
      setSignInGateLabel("reservar una clase de tu pack");
      return;
    }
    setShowPackBooking(true);
  }

  function handleSignInGateClose() {
    setPendingSession(null);
    setPendingReschedule(null);
    setSignInGateLabel("");
    setSelectedPack(null);
  }

  // Auto-open the correct booking view after sign-in (pending session)
  useEffect(() => {
    if (isSignedIn && pendingSession && !activeSession) {
      setActiveSession(pendingSession);
      setPendingSession(null);
      setSignInGateLabel("");
    }
  }, [isSignedIn, pendingSession, activeSession]);

  // After sign-in, apply any pending reschedule intent
  useEffect(() => {
    if (!isSignedIn || !pendingReschedule) return;
    const { type, token } = pendingReschedule;
    if (token) setRescheduleToken(token);
    if (type === "pack") {
      setForcePackBooking(true);
      setShowPackBooking(true);
    } else if (["free15min", "session1h", "session2h"].includes(type)) {
      setActiveSession(type as SingleSessionType);
    }
    setPendingReschedule(null);
    setSignInGateLabel("");
  }, [isSignedIn, pendingReschedule]);

  // Handle /?reschedule= param from confirmation emails
  useEffect(() => {
    const reschedule = searchParams.get("reschedule");
    const token      = searchParams.get("token");
    if (!reschedule) return;

    // Clear params from URL immediately regardless of auth state
    const url = new URL(window.location.href);
    url.searchParams.delete("reschedule");
    url.searchParams.delete("token");
    window.history.replaceState({}, "", url.toString());

    if (!isSignedIn) {
      // Not logged in — store intent and show sign-in gate.
      // The callbackUrl encodes the reschedule params so they survive the
      // Google OAuth round-trip and are processed on the next mount.
      const callbackUrl = token
        ? `/?reschedule=${encodeURIComponent(reschedule)}&token=${encodeURIComponent(token)}`
        : `/?reschedule=${encodeURIComponent(reschedule)}`;
      setPendingReschedule({ type: reschedule, token: token ?? null, callbackUrl });
      setSignInGateLabel("reprogramar tu clase");
      return;
    }

    // Already signed in — apply immediately
    if (token) setRescheduleToken(token);
    if (reschedule === "pack") {
      setForcePackBooking(true);
      setShowPackBooking(true);
    } else if (["free15min", "session1h", "session2h"].includes(reschedule)) {
      setActiveSession(reschedule as SingleSessionType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pack booking overlay — full-screen fixed ──────────────────────────────
  // Accessible when user has credits OR when opened via reschedule link
  // (forcePackBooking=true) so students can still cancel/reschedule after
  // using all their credits.
  const packStudentInfo = packSession
    ? { email: packSession.email, name: packSession.name, credits: packSession.credits }
    : googleUser?.email
      ? { email: googleUser.email, name: googleUser.name ?? "", credits: 0 }
      : null;

  if (showPackBooking && packStudentInfo && googleUser?.email) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--bg)",
          zIndex: 40,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            background: "var(--bg)",
            zIndex: 1,
          }}
        >
          <CreditsPill credits={packStudentInfo.credits} />
          <button
            onClick={() => setShowPackBooking(false)}
            style={{
              fontSize: 13,
              color: COLORS.textMuted,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = COLORS.textSecondary)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = COLORS.textMuted)
            }
            aria-label="Volver a la página principal"
          >
            ← Volver
          </button>
        </div>

        {/* Calendar */}
        <div style={{ flex: 1, padding: "8px 0" }}>
          <BookingModeViewComponent
            student={packStudentInfo}
            rescheduleToken={rescheduleToken}
            onCreditsUpdated={(remaining: number) => {
              updateCredits(remaining);
            }}
            onExit={() => { setShowPackBooking(false); setForcePackBooking(false); setRescheduleToken(null); }}
            hideTopBar
          />
        </div>
      </div>
    );
  }

  // ── Single session booking overlay ───────────────────────────────────────
  if (activeSession && googleUser?.email) {
    return (
      <SingleSessionBooking
        sessionType={activeSession}
        userName={googleUser.name ?? ""}
        userEmail={googleUser.email}
        rescheduleToken={rescheduleToken}
        onBack={() => { setActiveSession(null); setRescheduleToken(null); }}
      />
    );
  }

  // ── Normal landing interactive layer ────────────────────────────────────
  return (
    <>
      {signInGateLabel && !isSignedIn && (
        <SignInGate
          actionLabel={signInGateLabel}
          callbackUrl={pendingReschedule?.callbackUrl}
          onClose={handleSignInGateClose}
        />
      )}

      {selectedPack && isSignedIn && googleUser?.email && (
        <PackModal
          packSize={selectedPack}
          userEmail={googleUser.email}
          userName={googleUser.name ?? ""}
          onClose={() => setSelectedPack(null)}
          onCreditsReady={handleCreditsReady}
        />
      )}

      {/* Sessions section */}
      <section id="sessions" style={{ animation: "fadeUp 0.6s ease both 0.45s" }}>
        <h2
          style={{
            fontFamily: "var(--font-serif), 'DM Serif Display', serif",
            fontSize: "clamp(22px, 4vw, 28px)",
            color: "var(--text)",
            marginBottom: 6,
          }}
        >
          Reserva una sesión
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
          Elige el formato que mejor se adapta a lo que necesitas.
        </p>

        <SessionCard
          badge="Gratis"
          name="Encuentro inicial"
          duration="⏱ 15 minutos · Comentamos tu caso y definimos un plan"
          price="Sin coste"
          isFree
          onClick={() => handleSessionClick("free15min")}
        />
        <SessionCard
          badge="Más reservada"
          name="Sesión de 1 hora"
          duration="⏱ 60 minutos · Resolución de dudas o proyecto"
          price="€16"
          featured
          onClick={() => handleSessionClick("session1h")}
        />
        <SessionCard
          name="Sesión de 2 horas"
          duration="⏱ 120 minutos · Para temas que requieren profundidad"
          price="€30"
          onClick={() => handleSessionClick("session2h")}
        />
      </section>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--border), transparent)",
          margin: "32px 0",
        }}
      />

      {/* Packs section */}
      <section id="packs" style={{ animation: "fadeUp 0.6s ease both 0.55s" }}>
        <h2
          style={{
            fontFamily: "var(--font-serif), 'DM Serif Display', serif",
            fontSize: "clamp(22px, 4vw, 28px)",
            color: "var(--text)",
            marginBottom: 6,
          }}
        >
          Packs de horas
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
          Reserva por adelantado y ahorra. Válidos 6 meses desde la compra.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {PACK_SIZES.map((size) => (
            <PackCard
              key={size}
              size={size}
              activeCredits={creditsLoading ? null : packCreditsForSize(size)}
              creditsLoading={creditsLoading && isSignedIn}
              onBuy={handlePackBuy}
              onSchedule={handlePackSchedule}
            />
          ))}
        </div>
      </section>

      {/* Fixed overlays */}
      <AuthCorner
        user={googleUser}
        packCredits={packSession?.credits ?? null}
        packSize={packSession?.packSize ?? null}
      />
      <Chat />
    </>
  );
}
