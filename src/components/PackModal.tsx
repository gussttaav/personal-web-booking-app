"use client";

import { useState, useCallback } from "react";
import { Button, Alert, Card } from "@/components/ui";
import { COLORS, PACK_CONFIG } from "@/constants";
import { api, ApiError } from "@/lib/api-client";
import type { PackSize, StudentInfo } from "@/types";

interface PackModalProps {
  packSize: PackSize;
  /** Verified email from the Google session */
  userEmail: string;
  /** Verified name from the Google session */
  userName: string;
  onClose: () => void;
  /** Called when the user already has credits — skip checkout */
  onCreditsReady?: (student: StudentInfo) => void;
}

export default function PackModal({
  packSize,
  userEmail,
  userName,
  onClose,
  onCreditsReady,
}: PackModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pack = PACK_CONFIG[packSize];

  const handleBuy = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Check for existing credits first (user may have already purchased)
      const creditsData = await api.credits.get();
      if (creditsData.credits > 0) {
        onClose();
        onCreditsReady?.({
          email: userEmail,
          name: userName,
          credits: creditsData.credits,
        });
        return;
      }

      // No credits → go to Stripe (identity comes from server-side session)
      const checkoutData = await api.stripe.checkoutPack({ packSize });
      window.location.href = checkoutData.url;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Error de conexión. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }, [userEmail, userName, packSize, onClose, onCreditsReady]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pack-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: COLORS.brandMuted, color: COLORS.brand }}
              aria-hidden="true"
            >
              G
            </div>
            <div>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                Gustavo Torres Guerrero
              </p>
              <h2
                id="pack-modal-title"
                className="text-lg font-bold"
                style={{ color: COLORS.textPrimary }}
              >
                Pack {packSize} clases
              </h2>
            </div>
          </div>

          {/* Pack summary */}
          <div
            className="rounded-xl p-3 text-sm space-y-1"
            style={{ backgroundColor: COLORS.background }}
          >
            <p style={{ color: COLORS.textSecondary }}>
              🕐 {packSize} horas · A reservar individualmente
            </p>
            <p style={{ color: COLORS.textSecondary }}>
              💳 Pago único de{" "}
              <strong style={{ color: COLORS.textPrimary }}>{pack.price}</strong>
            </p>
            <p style={{ color: COLORS.textSecondary }}>
              📅 Válido{" "}
              <strong style={{ color: COLORS.textPrimary }}>6 meses</strong>{" "}
              desde la compra
            </p>
          </div>
        </div>

        {/* Signed-in user info */}
        <div
          className="flex items-center gap-3 rounded-xl p-3 mb-4"
          style={{
            background: COLORS.brandMuted,
            border: `1px solid ${COLORS.brandBorder}`,
          }}
        >
          <span style={{ fontSize: 20 }} aria-hidden="true">✓</span>
          <div>
            <p className="text-sm font-medium" style={{ color: COLORS.brand }}>
              Identificado como
            </p>
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>
              {userName} · {userEmail}
            </p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Atrás
          </Button>
          <Button
            variant="primary"
            onClick={handleBuy}
            isLoading={loading}
            loadingText="Verificando..."
            style={{ flex: 1 }}
          >
            Comprar · {pack.price}
          </Button>
        </div>

        <p
          className="text-xs text-center mt-4"
          style={{ color: COLORS.textMuted }}
        >
          🔒 Pago seguro con Stripe
        </p>
      </Card>
    </div>
  );
}
