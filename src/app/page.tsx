"use client";

import { useState } from "react";
import PackModal from "@/components/PackModal";

export default function HomePage() {
  const [selectedPack, setSelectedPack] = useState<5 | 10 | null>(null);

  const CAL_URL = process.env.NEXT_PUBLIC_CAL_URL || "https://cal.com/gustavo-torres";

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900">Gustavo Torres Guerrero</h1>
          <p className="text-gray-500 mt-1">Clases particulares · Reserva tu sesión</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">

        {/* ── SECCIÓN CAL.COM ── */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Reserva una clase individual
          </h2>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
            <iframe
              src={`${CAL_URL}?embed=true&theme=light`}
              width="100%"
              height="700"
              frameBorder="0"
              title="Reservar clase"
              className="block"
            />
          </div>
        </section>

        {/* ── SECCIÓN PACKS ── */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Packs de clases con descuento
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Compra un pack y ahorra. Reserva tus horas cuando quieras, sin caducidad.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pack 5 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Popular
                </span>
                <span className="text-2xl font-bold text-gray-900">€75</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pack 5 clases</h3>
                <p className="text-gray-500 text-sm mt-1">
                  5 sesiones de 1 hora · €15/clase (ahorra €5)
                </p>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Reserva cada clase cuando quieras</li>
                <li>✓ Acceso a Google Calendar en tiempo real</li>
                <li>✓ Sin caducidad</li>
              </ul>
              <button
                onClick={() => setSelectedPack(5)}
                className="mt-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Comprar Pack 5
              </button>
            </div>

            {/* Pack 10 */}
            <div className="bg-white rounded-2xl border-2 border-indigo-500 shadow-md p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                MEJOR PRECIO
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  Ahorra más
                </span>
                <span className="text-2xl font-bold text-gray-900">€140</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pack 10 clases</h3>
                <p className="text-gray-500 text-sm mt-1">
                  10 sesiones de 1 hora · €14/clase (ahorra €20)
                </p>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Reserva cada clase cuando quieras</li>
                <li>✓ Acceso a Google Calendar en tiempo real</li>
                <li>✓ Sin caducidad</li>
              </ul>
              <button
                onClick={() => setSelectedPack(10)}
                className="mt-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Comprar Pack 10
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal para seleccionar pack */}
      {selectedPack && (
        <PackModal
          packSize={selectedPack}
          onClose={() => setSelectedPack(null)}
        />
      )}
    </main>
  );
}
