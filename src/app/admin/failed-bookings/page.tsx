/**
 * ADMIN-01: Failed bookings (dead-letter) UI.
 * Uses paymentService.listFailedBookings() and the existing retry API (REL-03).
 */

import { paymentService } from "@/services";
import { RetryButton } from "@/components/admin/RetryButton";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function FailedBookingsPage() {
  const entries = await paymentService.listFailedBookings();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reservas fallidas</h1>

      {entries.length === 0 ? (
        <p className="text-white/40">Sin reservas fallidas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#1e1e20] text-left text-xs text-white/40">
                <th className="px-4 py-3">Fecha fallo</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Error</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.stripeSessionId} className="border-b border-white/5">
                  <td className="px-4 py-3 text-white/50 whitespace-nowrap">
                    {formatDateTime(e.failedAt)}
                  </td>
                  <td className="px-4 py-3 text-white/70">{e.email}</td>
                  <td className="px-4 py-3 text-white/50 whitespace-nowrap">
                    {formatDateTime(e.startIso)}
                  </td>
                  <td className="px-4 py-3 text-red-400 text-xs max-w-xs truncate" title={e.error}>
                    {e.error}
                  </td>
                  <td className="px-4 py-3">
                    <RetryButton stripeSessionId={e.stripeSessionId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
