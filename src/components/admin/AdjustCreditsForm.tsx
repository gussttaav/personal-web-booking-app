/**
 * ADMIN-01: Client component for adjusting a student's credit balance.
 * POSTs to /api/admin/students/[email] and reloads the page on success.
 */
"use client";

import { useState } from "react";

interface AdjustCreditsFormProps {
  email: string;
}

export function AdjustCreditsForm({ email }: AdjustCreditsFormProps) {
  const [amount, setAmount]   = useState(1);
  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) {
      setError("La razón es obligatoria.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adjust_credits", amount, reason: reason.trim() }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al ajustar créditos.");
      }
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-[#1e1e20] p-4">
      <h3 className="mb-3 text-sm font-medium text-white/70">Ajustar créditos</h3>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/50">
          Cantidad (+/−)
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(parseInt(e.target.value, 10) || 0)}
            className="w-24 rounded border border-white/10 bg-[#131315] px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-white/50">
          Razón (se registra en el historial)
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej: Corrección manual por error de cobro"
            className="rounded border border-white/10 bg-[#131315] px-2 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
          />
        </label>
        <button
          onClick={submit}
          disabled={loading}
          className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-[#131315] transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {loading ? "Guardando…" : "Ajustar"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
