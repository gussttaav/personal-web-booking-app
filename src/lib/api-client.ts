/**
 * Typed API client for all server interactions.
 *
 * OAuth2 readiness: add `getAccessToken()` here and attach
 *   Authorization: Bearer <token>
 * to the headers object. Every consumer will get auth for free.
 */

import type {
  BookResponse,
  CheckoutResponse,
  CreditsResponse,
  PackSize,
} from "@/types";

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // OAuth2 hook: Authorization: `Bearer ${await getAccessToken()}`,
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error ?? "Error desconocido", res.status);
  }

  return data as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

export const api = {
  credits: {
    get: (email: string) =>
      request<CreditsResponse>(
        `/api/credits?email=${encodeURIComponent(email)}`
      ),
  },

  book: {
    post: (email: string) =>
      request<BookResponse>("/api/book", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  },

  stripe: {
    checkout: (params: { name: string; email: string; packSize: PackSize }) =>
      request<CheckoutResponse>("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  },
} as const;
