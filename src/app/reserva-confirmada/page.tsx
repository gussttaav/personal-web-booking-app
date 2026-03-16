"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { COLORS } from "@/constants";

const REDIRECT_SECONDS = 5;

export default function ReservaConfirmadaPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: COLORS.background, position: "relative", zIndex: 1 }}
    >
      <div
        className="rounded-2xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center space-y-6"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl"
          style={{ background: COLORS.brandMuted, color: COLORS.brand }}
          aria-hidden="true"
        >
          ✓
        </div>

        {/* Title */}
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: COLORS.textPrimary }}
          >
            ¡Reserva confirmada!
          </h1>
          <p className="mt-2 text-sm" style={{ color: COLORS.textSecondary }}>
            Tu encuentro inicial ha sido reservado. Recibirás una confirmación
            por email con el enlace de Google Meet.
          </p>
        </div>

        {/* Info card */}
        <div
          className="rounded-xl p-4 text-sm space-y-1 text-left"
          style={{
            background: COLORS.background,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <p style={{ color: COLORS.textSecondary }}>
            📅 Revisa tu email para los detalles de la cita
          </p>
          <p style={{ color: COLORS.textSecondary }}>
            🔗 El enlace de Google Meet llegará en la confirmación
          </p>
          <p style={{ color: COLORS.textSecondary }}>
            ↩️ Puedes cancelar hasta 2 horas antes
          </p>
        </div>

        {/* Countdown */}
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          Volviendo al inicio en{" "}
          <span style={{ color: COLORS.brand, fontWeight: 500 }}>
            {countdown}s
          </span>
          …
        </p>

        {/* Manual redirect */}
        <button
          onClick={() => router.push("/")}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{
            background: COLORS.brand,
            color: "#0d0f10",
            border: "none",
            cursor: "pointer",
          }}
        >
          Volver al inicio ahora
        </button>
      </div>
    </main>
  );
}
