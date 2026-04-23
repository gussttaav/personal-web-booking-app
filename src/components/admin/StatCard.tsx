/**
 * ADMIN-01: Dashboard metric card.
 */

import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  href:  string;
  tone?: "neutral" | "alert";
}

export function StatCard({ label, value, href, tone = "neutral" }: StatCardProps) {
  const isAlert = tone === "alert";
  return (
    <Link
      href={href}
      className={`block rounded-lg border p-5 transition-colors hover:border-white/20 ${
        isAlert ? "border-red-500/40 bg-red-950/20" : "border-white/10 bg-[#1e1e20]"
      }`}
    >
      <div className={`text-2xl font-bold ${isAlert ? "text-red-400" : "text-primary"}`}>
        {value}
      </div>
      <div className="mt-1 text-sm text-white/50">{label}</div>
    </Link>
  );
}
