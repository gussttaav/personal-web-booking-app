"use client";

import { useState, useCallback } from "react";
import { Button, Alert, Card } from "@/components/ui";
import { COLORS, PACK_CONFIG } from "@/constants";
import { api, ApiError } from "@/lib/api-client";
import type { PackSize, StudentInfo } from "@/types";

interface PackModalProps {
  packSize: PackSize;
  onClose: () => void;
  /** Called when the user already has credits — skip checkout and go straight to booking */
  onCreditsReady?: (student: StudentInfo) => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#0f1117",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
  padding: "10px 16px",
  fontSize: "14px",
  color: "#ffffff",
  outline: "none",
  transition: "border-color 0.2s",
};

function validateForm(name: string, email: string): string | null {
  if (!name.trim()) return "Por favor, escribe tu nombre.";
  if (!email.trim()) return "Por favor, escribe tu email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "El email no es válido.";
  return null;
}

export default function PackModal({ packSize, onClose, onCreditsReady }: PackModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pack = PACK_CONFIG[packSize];

  const handleSubmit = useCallback(async () => {
    const validationError = validateForm(name, email);
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");

    try {
      // Check for existing credits first
      const creditsData = await api.credits.get(email.trim());

      if (creditsData.credits > 0) {
        onClose();
        onCreditsReady?.({ email: email.trim(), name: name.trim(), credits: creditsData.credits });
        return;
      }

      // No credits → go to Stripe
      const checkoutData = await api.stripe.checkout({
        name: name.trim(),
        email: email.trim(),
        packSize,
      });

      window.location.href = checkoutData.url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [name, email, packSize, onClose, onCreditsReady]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

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
              <h2 id="pack-modal-title" className="text-lg font-bold text-white">
                Pack {packSize} clases
              </h2>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl p-3 text-sm space-y-1" style={{ backgroundColor: "#0f1117" }}>
            <p style={{ color: COLORS.textSecondary }}>
              🕐 {packSize} horas · A reservar individualmente
            </p>
            <p style={{ color: COLORS.textSecondary }}>
              💳 Pago único de{" "}
              <strong className="text-white">{pack.price}</strong>
            </p>
            <p style={{ color: COLORS.textSecondary }}>
              📅 Válido{" "}
              <strong className="text-white">6 meses</strong> desde la compra
            </p>
          </div>
        </div>

        {/* Form */}
        {/* OAuth2 note: replace this form with an OAuth login button.
            The onCreditsReady / Stripe flow stays the same. */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="modal-name"
              className="block text-sm font-medium mb-1"
              style={{ color: COLORS.textBody }}
            >
              Tu Nombre <span style={{ color: COLORS.brand }} aria-hidden="true">*</span>
            </label>
            <input
              id="modal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="María García"
              autoComplete="name"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.brand)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border)}
            />
          </div>

          <div>
            <label
              htmlFor="modal-email"
              className="block text-sm font-medium mb-1"
              style={{ color: COLORS.textBody }}
            >
              Email <span style={{ color: COLORS.brand }} aria-hidden="true">*</span>
            </label>
            <input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="maria@ejemplo.com"
              autoComplete="email"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.brand)}
              onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.border)}
            />
          </div>

          {error && <Alert variant="error">{error}</Alert>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Atrás
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Verificando..."
            style={{ flex: 1 }}
          >
            Continuar
          </Button>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: COLORS.textMuted }}>
          El pago se procesará de forma segura a través de Stripe.
        </p>
      </Card>
    </div>
  );
}
