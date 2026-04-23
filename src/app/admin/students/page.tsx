/**
 * ADMIN-01: Student list with optional low-credit filter.
 */

import Link from "next/link";
import { fetchStudents } from "../_data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

interface StudentsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const { filter } = await searchParams;
  const students = await fetchStudents(filter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alumnos</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/students"
            className={`rounded px-3 py-1.5 transition-colors ${
              !filter ? "bg-primary/10 text-primary" : "text-white/50 hover:text-white"
            }`}
          >
            Todos
          </Link>
          <Link
            href="/admin/students?filter=low-credit"
            className={`rounded px-3 py-1.5 transition-colors ${
              filter === "low-credit" ? "bg-red-500/10 text-red-400" : "text-white/50 hover:text-white"
            }`}
          >
            Pocos créditos
          </Link>
        </div>
      </div>

      <p className="mb-3 text-xs text-white/30">
        Mostrando {students.length} {filter === "low-credit" ? "alumnos con ≤1 crédito" : `de hasta 100 alumnos`}
      </p>

      {students.length === 0 ? (
        <p className="text-white/40">No hay alumnos.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#1e1e20] text-left text-xs text-white/40">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3 text-right">Créditos</th>
                <th className="px-4 py-3">Caduca</th>
                <th className="px-4 py-3">Próx. sesión</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.email} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/students/${encodeURIComponent(s.email)}`}
                      className="text-primary hover:underline"
                    >
                      {s.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/70">{s.name}</td>
                  <td className={`px-4 py-3 text-right font-mono ${s.totalCredits <= 1 ? "text-red-400" : "text-white"}`}>
                    {s.totalCredits}
                  </td>
                  <td className="px-4 py-3 text-white/50">
                    {s.earliestExpiry ? formatDate(s.earliestExpiry) : "—"}
                  </td>
                  <td className="px-4 py-3 text-white/50">
                    {s.nextSession ? formatDateTime(s.nextSession) : "—"}
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
