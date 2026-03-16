"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";
import { COLORS, CAL_EVENTS } from "@/constants";
import { api, ApiError } from "@/lib/api-client";

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

export type SingleSessionType = "free15min" | "session1h" | "session2h";

interface SingleSessionBookingProps {
  sessionType: SingleSessionType;
  userName: string;
  userEmail: string;
  onBack: () => void;
}

const SESSION_LABELS: Record<SingleSessionType, string> = {
  free15min: "Encuentro inicial · 15 min",
  session1h: "Sesión de 1 hora",
  session2h: "Sesión de 2 horas",
};

type Phase = "booking" | "redirecting" | "error";

export default function SingleSessionBooking({
  sessionType,
  userName,
  userEmail,
  onBack,
}: SingleSessionBookingProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("booking");
  const [errorMsg, setErrorMsg] = useState("");

  const handleBookingSuccess = useCallback(async () => {
    // Free 15-min session — just go to confirmation page
    if (sessionType === "free15min") {
      router.push("/reserva-confirmada");
      return;
    }

    // Paid sessions — create a Stripe checkout session then redirect
    setPhase("redirecting");
    try {
      const duration = sessionType === "session1h" ? "1h" : "2h";
      const data = await api.stripe.checkoutSingleSession({ duration });
      window.location.href = data.url;
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : "Error al iniciar el pago. Por favor inténtalo de nuevo."
      );
      setPhase("error");
    }
  }, [sessionType, router]);

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
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {SESSION_LABELS[sessionType]}
        </span>
        <button
          onClick={onBack}
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--text)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")
          }
          aria-label="Volver a la página principal"
        >
          ← Volver
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "8px 0" }}>
        {phase === "booking" && (
          <CalComBooking
            calLink={CAL_EVENTS[sessionType]}
            userName={userName}
            userEmail={userEmail}
            theme="dark"
            brandColor={COLORS.brand}
            namespace={sessionType}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {phase === "redirecting" && (
          <div
            className="flex flex-col items-center justify-center gap-4"
            style={{ minHeight: "400px" }}
          >
            <Spinner />
            <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>
              Redirigiendo al pago...
            </p>
          </div>
        )}

        {phase === "error" && (
          <div
            className="flex flex-col items-center justify-center gap-4 p-8"
            style={{ minHeight: "400px", maxWidth: 400, margin: "0 auto" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
              style={{ background: COLORS.errorBg, color: COLORS.error }}
              aria-hidden="true"
            >
              ✕
            </div>
            <p
              className="text-center text-sm"
              style={{ color: COLORS.textSecondary }}
            >
              {errorMsg}
            </p>
            <button
              onClick={() => setPhase("booking")}
              className="text-sm"
              style={{
                color: COLORS.brand,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
