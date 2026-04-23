/**
 * ADMIN-01: Client component to retry a failed booking.
 * POSTs to the existing /api/admin/failed-bookings endpoint (REL-03).
 */
"use client";

import { useState } from "react";

interface RetryButtonProps {
  stripeSessionId: string;
}

export function RetryButton({ stripeSessionId }: RetryButtonProps) {
  const [status, setStatus]   = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function retry() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/failed-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeSessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data as { ok?: boolean }).ok) {
        setStatus("ok");
        setMessage("Procesado correctamente.");
      } else {
        setStatus("error");
        setMessage((data as { error?: string }).error ?? "Error al reintentar.");
      }
    } catch {
      setStatus("error");
      setMessage("Error de red.");
    }
  }

  if (status === "ok") {
    return <span className="text-xs text-primary">✓ {message}</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={retry}
        disabled={status === "loading"}
        className="rounded border border-white/10 px-3 py-1 text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40"
      >
        {status === "loading" ? "Reintentando…" : "Reintentar"}
      </button>
      {status === "error" && message && (
        <span className="text-xs text-red-400">{message}</span>
      )}
    </div>
  );
}
