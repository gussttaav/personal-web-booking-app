/**
 * lib/admin.ts
 *
 * REL-03 — Admin authorization check.
 *
 * Admin routes are guarded by comparing the authenticated user's email
 * against ADMIN_EMAILS (comma-separated list). This is sufficient for a
 * single-tutor platform; migrate to a proper role column when the database
 * lands (Phase 4).
 */

import type { Session } from "next-auth";

export function isAdmin(session: Session | null): boolean {
  if (!session?.user?.email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(session.user.email.toLowerCase());
}
