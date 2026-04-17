/**
 * lib/csrf.ts — CSRF protection via Origin header validation
 *
 * SEC-04: NextAuth's session cookie is SameSite=Lax, which mitigates the
 * basic form-POST CSRF vector. This adds defense in depth by rejecting any
 * state-mutating request whose Origin does not match our own origin.
 *
 * Why not CSRF tokens?
 *   - Our API is consumed exclusively by our own frontend on the same origin
 *   - Origin header is set by the browser on all fetch/XHR POSTs
 *   - Cookie-bearing cross-origin requests will have a different Origin
 *   - Simpler, no token lifecycle to manage
 *
 * Exemptions:
 *   - /api/stripe/webhook has signature verification (better auth than CSRF)
 *   - /api/zoom/end has X-Internal-Secret (not user-facing)
 *   - /api/auth/* handled by NextAuth
 */

import type { NextRequest } from "next/server";

export function isValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) return false;
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}
