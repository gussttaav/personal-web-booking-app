/**
 * ADMIN-01: Admin bookings list — all bookings ordered by start time (most recent first).
 */

import Link from "next/link";
import { fetchAllBookings } from "../_data";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusBadge(status: string) {
  const classes: Record<string, string> = {
    confirmed:  "bg-primary/10 text-primary",
    cancelled:  "bg-white/10 text-white/40",
    completed:  "bg-blue-500/10 text-blue-400",
    no_show:    "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${classes[status] ?? "bg-white/10 text-white/40"}`}>
      {status}
    </span>
  );
}

export default async function BookingsPage() {
  const bookings = await fetchAllBookings();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reservas</h1>
      <p className="mb-3 text-xs text-white/30">Mostrando hasta 100 reservas más recientes.</p>

      {bookings.length === 0 ? (
        <p className="text-white/40">No hay reservas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#1e1e20] text-left text-xs text-white/40">
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/students/${encodeURIComponent(b.email)}`}
                      className="text-primary hover:underline"
                    >
                      {b.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/70">{b.session_type}</td>
                  <td className="px-4 py-3 text-white/50">{formatDateTime(b.starts_at)}</td>
                  <td className="px-4 py-3 text-white/50">{formatDateTime(b.ends_at)}</td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
