/**
 * ADMIN-01: Protected admin layout.
 * Redirects non-admins to "/" using the isAdmin helper (REL-03).
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { title: "Admin — gustavoai.dev" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!isAdmin(session)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#131315] text-white">
      <AdminNav email={session!.user!.email!} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
