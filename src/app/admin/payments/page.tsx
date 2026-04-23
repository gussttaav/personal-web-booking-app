/**
 * ADMIN-01: Payment history — last 100 payments with 30-day revenue total.
 */

import { fetchPayments, sumRevenueLast30Days } from "../_data";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusBadge(status: string) {
  const classes: Record<string, string> = {
    succeeded: "bg-primary/10 text-primary",
    pending:   "bg-yellow-500/10 text-yellow-400",
    refunded:  "bg-blue-500/10 text-blue-400",
    failed:    "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${classes[status] ?? "bg-white/10 text-white/40"}`}>
      {status}
    </span>
  );
}

export default async function PaymentsPage() {
  const [payments, revenueCents] = await Promise.all([
    fetchPayments(),
    sumRevenueLast30Days(),
  ]);

  const revenue = (revenueCents / 100).toFixed(2);

  return (
    <div>
      <div className="mb-6 flex items-baseline gap-6">
        <h1 className="text-2xl font-bold">Pagos</h1>
        <span className="text-sm text-white/40">
          Ingresos últimos 30 días:{" "}
          <span className="font-semibold text-primary">€{revenue}</span>
        </span>
      </div>
      <p className="mb-3 text-xs text-white/30">Mostrando hasta 100 pagos más recientes.</p>

      {payments.length === 0 ? (
        <p className="text-white/40">No hay pagos.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#1e1e20] text-left text-xs text-white/40">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Alumno</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Stripe ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-white/50 whitespace-nowrap">
                    {formatDateTime(p.created_at)}
                  </td>
                  <td className="px-4 py-3 text-white/70">{p.email}</td>
                  <td className="px-4 py-3 text-white/50">{p.checkout_type}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    €{(p.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-white/30 text-xs font-mono truncate max-w-[140px]" title={p.stripe_payment_id}>
                    {p.stripe_payment_id}
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
