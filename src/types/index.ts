// ─── Domain types ────────────────────────────────────────────────────────────

export type PackSize = 5 | 10;

export interface StudentInfo {
  email: string;
  name: string;
  credits: number;
}

export interface CreditResult {
  credits: number;
  name: string;
  expiresAt?: string;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export interface BookResponse {
  ok: true;
  remaining: number;
}

export interface CreditsResponse {
  credits: number;
  name: string;
}

export interface CheckoutResponse {
  url: string;
}

// ─── OAuth2-ready session shape (used today via URL params, later via OAuth) ─
// When you add OAuth2, replace `UserSession` population in `useUserSession`
// hook — the rest of the app will keep working without changes.

export interface UserSession {
  email: string;
  name: string;
  credits: number;
  /** ISO string — populated once credits are confirmed */
  creditsConfirmedAt?: string;
}
