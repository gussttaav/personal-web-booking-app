/**
 * POST /api/test/auth
 *
 * TEST-02: Test-only auth bypass for Playwright E2E tests.
 *
 * Returns 404 unless E2E_MODE=true, so this endpoint is invisible in
 * production. It signs a real NextAuth v5 JWT and sets the session cookie,
 * allowing tests to skip Google OAuth entirely.
 *
 * Security layers:
 *   1. E2E_MODE gate — returns 404 if not in test mode
 *   2. E2E_EMAILS whitelist — rejects emails not listed in env var
 *   3. Production guard — startup-checks.ts throws if E2E_MODE=true in prod
 */

import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  if (process.env.E2E_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { email, name } = await req.json().catch(() => ({})) as { email?: string; name?: string };

  if (!email || !name) {
    return NextResponse.json({ error: "email and name are required" }, { status: 400 });
  }

  const whitelist = (process.env.E2E_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!whitelist.includes(email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // NextAuth v5 uses the cookie name as the JOSE salt for JWT encoding.
  const isSecure   = process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const maxAge     = 60 * 60 * 24 * 30; // 30 days — matches auth.ts

  const token = await encode({
    token:  { email, name, sub: email },
    secret: process.env.AUTH_SECRET!,
    salt:   cookieName,
    maxAge,
  });

  const secure  = isSecure ? "; Secure" : "";
  const cookie  = `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;

  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": cookie },
  });
}
