"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PackModalProps {
  packSize: 5 | 10;
  onClose: () => void;
}

export default function PackModal({ packSize, onClose }: PackModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const price = packSize === 5 ? "€75" : "€140";

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError("Por favor, rellena tu nombre y email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("El email no es válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Check if student already has credits
      const res = await fetch(`/api/credits?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.credits > 0) {
        // Already has credits → go directly to booking
        router.push(
          `/reservar?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&credits=${data.credits}`
        );
        return;
      }

      // 2. No credits → redirect to Stripe checkout
      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, packSize }),
      });
      const checkoutData = await checkoutRes.json();

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        setError("Error al crear la sesión de pago. Inténtalo de nuevo.");
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Left column info (like cal.com) */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
              G
            </div>
            <div>
              <p className="text-sm text-gray-500">Gustavo Torres Guerrero</p>
              <h2 className="text-lg font-bold text-gray-900">Pack {packSize} clases</h2>
            </div>
          </div>
          <div className="text-sm text-gray-500 space-y-1 bg-gray-50 rounded-xl p-3">
            <p>🕐 {packSize} horas · A reservar individualmente</p>
            <p>💳 Pago único de <strong className="text-gray-700">{price}</strong></p>
            <p>📅 Sin caducidad</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tu Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="María García"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@ejemplo.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Atrás
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {loading ? "Procesando..." : "Continuar"}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Al continuar, el pago se procesará de forma segura a través de Stripe.
        </p>
      </div>
    </div>
  );
}
