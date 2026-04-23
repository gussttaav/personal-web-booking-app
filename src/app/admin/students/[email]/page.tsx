/**
 * ADMIN-01: Student detail page — credit packs, bookings, audit log, and credit adjustment.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchStudent, fetchCreditPacks, fetchStudentBookings, fetchAuditLog } from "../../_data";
import { AdjustCreditsForm } from "@/components/admin/AdjustCreditsForm";
import type { AuditEntry } from "@/domain/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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

interface StudentDetailPageProps {
  params: Promise<{ email: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail);

  const [student, packs, bookings, audit] = await Promise.all([
    fetchStudent(email),
    fetchCreditPacks(email),
    fetchStudentBookings(email),
    fetchAuditLog(email),
  ]);

  if (!student) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/students" className="text-xs text-white/40 hover:text-white/70">
          ← Alumnos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{student.name}</h1>
        <p className="text-sm text-white/40">{student.email}</p>
      </div>

      {/* Credit packs */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Créditos</h2>
        {packs.length === 0 ? (
          <p className="text-sm text-white/40">Sin packs de créditos.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#1e1e20] text-left text-xs text-white/40">
                  <th className="px-4 py-3">Pack</th>
                  <th className="px-4 py-3 text-right">Restantes</th>
                  <th className="px-4 py-3">Caduca</th>
                  <th className="px-4 py-3">Comprado</th>
                </tr>
              </thead>
              <tbody>
                {packs.map(p => {
                  const expired = new Date(p.expires_at) < new Date();
                  return (
                    <tr key={p.id} className={`border-b border-white/5 ${expired ? "opacity-40" : ""}`}>
                      <td className="px-4 py-3 text-white/70">{p.pack_size} sesiones</td>
                      <td className="px-4 py-3 text-right font-mono">{p.credits_remaining}</td>
                      <td className={`px-4 py-3 ${expired ? "text-red-400" : "text-white/50"}`}>
                        {formatDate(p.expires_at)} {expired && "(vencido)"}
                      </td>
                      <td className="px-4 py-3 text-white/50">{formatDate(p.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <AdjustCreditsForm email={email} />
      </section>

      {/* Bookings */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Reservas</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-white/40">Sin reservas.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#1e1e20] text-left text-xs text-white/40">
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Inicio</th>
                  <th className="px-4 py-3">Fin</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-white/5">
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
      </section>

      {/* Audit log */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Historial</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-white/40">Sin entradas.</p>
        ) : (
          <div className="rounded-lg border border-white/10 divide-y divide-white/5">
            {audit.map((entry: AuditEntry, i) => (
              <div key={i} className="flex items-start gap-4 px-4 py-3 text-sm">
                <span className="w-36 shrink-0 text-xs text-white/30">
                  {entry.ts ? formatDateTime(entry.ts) : "—"}
                </span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/60">{entry.action}</span>
                <span className="text-white/40 text-xs font-mono break-all">
                  {Object.entries(entry)
                    .filter(([k]) => k !== "action" && k !== "ts")
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
