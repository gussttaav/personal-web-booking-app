/**
 * ADMIN-01: Admin dashboard home — 4 key metric cards.
 */

import {
  countUpcomingBookings,
  countStudentsWithLowCredits,
  countFailedBookings,
  sumRevenueLast30Days,
} from "./_data";
import { StatCard } from "@/components/admin/StatCard";

export default async function AdminDashboard() {
  const [upcoming, lowCredit, failed, revenueCents] = await Promise.all([
    countUpcomingBookings(),
    countStudentsWithLowCredits(),
    countFailedBookings(),
    sumRevenueLast30Days(),
  ]);

  const revenue = (revenueCents / 100).toFixed(2);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Panel de control</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Sesiones próximas"
          value={upcoming}
          href="/admin/bookings"
        />
        <StatCard
          label="Alumnos con pocos créditos"
          value={lowCredit}
          href="/admin/students?filter=low-credit"
          tone={lowCredit > 0 ? "alert" : "neutral"}
        />
        <StatCard
          label="Reservas fallidas"
          value={failed}
          href="/admin/failed-bookings"
          tone={failed > 0 ? "alert" : "neutral"}
        />
        <StatCard
          label="Ingresos (30 días)"
          value={`€${revenue}`}
          href="/admin/payments"
        />
      </div>
    </div>
  );
}
