"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Alert, Spinner } from "@/components/ui";
import { COLORS } from "@/constants";
import { api, ApiError } from "@/lib/api-client";

function BookingContent() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email") ?? "";
  const name = params.get("name") ?? "";
  const [credits, setCredits] = useState(parseInt(params.get("credits") ?? "0", 10));
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const CALENDAR_ID = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID ?? "";
  const calendarEmbedUrl = `https://calendar.google.com/calendar/appointments/schedules/${CALENDAR_ID}?gv=true`;

  // Guard: redirect if no email
  useEffect(() => {
    if (!email) router.replace("/");
  }, [email, router]);

  async function confirmBooking() {
    if (credits <= 0) { setError("No tienes créditos disponibles."); return; }
    setBooking(true);
    setError("");
    try {
      const data = await api.book.post(email);
      setCredits(data.remaining);
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de conexión.");
    } finally {
      setBooking(false);
    }
  }

  if (!email) return null;

  return (
    <main className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <header
        className="border-b py-4 sm:py-5 px-4"
        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white">Reservar clase</h1>
            <p className="text-sm truncate" style={{ color: COLORS.textSecondary }}>
              Hola, {name} · {email}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold" style={{ color: COLORS.brand }}>
              {credits}
            </p>
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>
              clase{credits !== 1 ? "s" : ""} disponible{credits !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {credits === 0 && (
          <Alert variant="warning">
            <p className="font-medium">No tienes clases disponibles.</p>
            <a href="/" className="inline-block mt-3 text-sm font-semibold underline">
              Comprar otro pack
            </a>
          </Alert>
        )}

        {confirmed && (
          <Alert variant="success">
            <p className="font-semibold text-lg">✓ ¡Clase confirmada!</p>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
              Te quedan <strong className="text-white">{credits}</strong> clase
              {credits !== 1 ? "s" : ""}.
            </p>
          </Alert>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        {credits > 0 && (
          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
          >
            <h2 className="text-lg font-semibold text-white mb-1">Elige tu horario</h2>
            <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }}>
              Selecciona un hueco en el calendario y pulsa{" "}
              <strong className="text-white">"Confirmar reserva"</strong> para descontar
              una clase.
            </p>

            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${COLORS.border}` }}
            >
              <iframe
                src={calendarEmbedUrl}
                style={{ border: 0, backgroundColor: COLORS.background }}
                width="100%"
                height="600"
                title="Elegir horario"
                loading="lazy"
              />
            </div>

            <div className="mt-6 text-center space-y-2">
              <Button
                variant="primary"
                onClick={confirmBooking}
                isLoading={booking}
                loadingText="Confirmando..."
                disabled={booking || credits <= 0}
                style={{ padding: "0.75rem 2rem" }}
              >
                Confirmar reserva (−1 crédito)
              </Button>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                Elige horario en el calendario y luego pulsa este botón.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ReservarPage() {
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
      <BookingContent />
    </Suspense>
  );
}
