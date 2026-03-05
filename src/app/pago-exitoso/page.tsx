"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email") || "";
  const name = params.get("name") || "";
  const pack = params.get("pack") || "";
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!email) return;
    // Poll for credits (webhook might take a second)
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const res = await fetch(`/api/credits?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.credits > 0) {
        setCredits(data.credits);
        clearInterval(interval);
      }
      if (attempts > 10) clearInterval(interval); // stop after ~10s
    }, 1000);
    return () => clearInterval(interval);
  }, [email]);

  function goToBooking() {
    router.push(
      `/reservar?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&credits=${credits}`
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">¡Pago completado!</h1>
          <p className="text-gray-500 mt-2">
            Gracias, <strong>{name}</strong>. Tu Pack {pack} ha sido activado.
          </p>
        </div>

        {credits === null ? (
          <div className="text-sm text-gray-400 animate-pulse">
            Activando tus créditos...
          </div>
        ) : (
          <div className="bg-indigo-50 rounded-xl p-4">
            <p className="text-indigo-700 font-semibold text-lg">
              🎉 Tienes {credits} clase{credits !== 1 ? "s" : ""} disponible{credits !== 1 ? "s" : ""}
            </p>
            <p className="text-indigo-500 text-sm mt-1">
              Reserva tus horas cuando quieras
            </p>
          </div>
        )}

        <button
          onClick={goToBooking}
          disabled={credits === null}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Reservar mis clases →
        </button>

        <a href="/" className="block text-sm text-gray-400 hover:text-gray-600">
          Volver al inicio
        </a>
      </div>
    </main>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
