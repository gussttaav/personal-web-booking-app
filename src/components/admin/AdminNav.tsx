/**
 * ADMIN-01: Admin navigation bar.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/admin",                label: "Panel" },
  { href: "/admin/students",       label: "Alumnos" },
  { href: "/admin/bookings",       label: "Reservas" },
  { href: "/admin/failed-bookings", label: "Fallidas" },
  { href: "/admin/payments",       label: "Pagos" },
];

interface AdminNavProps {
  email: string;
}

export function AdminNav({ email }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 px-6 py-3 bg-[#1e1e20] border-b border-white/10">
      <span className="text-primary font-bold mr-4 text-sm tracking-wide uppercase">Admin</span>
      {NAV_LINKS.map(link => {
        const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <span className="ml-auto text-xs text-white/40">{email}</span>
    </nav>
  );
}
