"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function BookingContent() {
  const params = useSearchParams();
  const router = useRouter();

  const email = params.get("email") || "";
  const name = params.get("name") || "";
  const [credits, setCredits] = useState(parseInt(params.get("credits") || "0", 10));
  const [booking, setBooking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const CALENDAR_ID = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || "";

  // Redirect if no email or credits
  useEffect(() => {
    if (!email) {
      router.push("/");
    }
  }, [email, router]);

  async function confirmBooking() {
    if (credits <= 0) {
      setError("No tienes créditos disponibles.");
      return;
    }
    setBooking(true);
    setError("");

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.ok) {
        setCredits(data.remaining);
        setConfirmed(true);
      } else {
        setError(data.error || "Error al confirmar la reserva.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setBooking(false);
    }
  }

  // Google Calendar appointment scheduling embed URL
  // Replace CALENDAR_ID with your actual calendar ID in env vars
  const calendarEmbedUrl = `https://calendar.google.com/calendar/appointments/schedules/${CALENDAR_ID}?gv=true`;

  if (!email) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-5 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reservar clase</h1>
            <p className="text-sm text-gray-500">Hola, {name} · {email}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">{credits}</p>
            <p className="text-xs text-gray-400">clase{credits !== 1 ? "s" : ""} disponible{credits !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {credits === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-amber-700 font-medium">No tienes clases disponibles.</p>
            <a
              href="/"
              className="inline-block mt-3 bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Comprar otro pack
            </a>
          </div>
        )}

        {confirmed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-semibold text-lg">✓ ¡Clase confirmada!</p>
            <p className="text-green-600 text-sm mt-1">
              Te quedan <strong>{credits}</strong> clase{credits !== 1 ? "s" : ""}.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {credits > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Elige tu horario
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona un hueco disponible en el calendario. Cuando elijas un horario, pulsa <strong>"Confirmar reserva"</strong> para descontar una clase de tu pack.
            </p>

            {/* Google Calendar Appointment Scheduling embed */}
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <iframe
                src={calendarEmbedUrl}
                style={{ border: 0 }}
                width="100%"
                height="600"
                frameBorder="0"
                title="Elegir horario"
              />
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={confirmBooking}
                disabled={booking || credits <= 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-sm"
              >
                {booking ? "Confirmando..." : `Confirmar reserva (-1 crédito)`}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Después de elegir horario en el calendario, pulsa este botón para descontar 1 crédito.
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
    <Suspense>
      <BookingContent />
    </Suspense>
  );
}
