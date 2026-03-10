"use client";

/**
 * useUserSession
 *
 * Today: reads session from URL search params (post-Stripe redirect).
 * OAuth2 migration path:
 *   1. Replace the URL-param logic with a call to your OAuth provider's
 *      `useSession()` hook (e.g. NextAuth's `useSession`, Auth0's `useUser`).
 *   2. Map the provider's user object to `UserSession`.
 *   3. The rest of the app keeps working without changes.
 */

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { UserSession } from "@/types";

export function useUserSession() {
  const params = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Path 1: returning from Stripe with booking=1 in URL
    if (params.get("booking") === "1") {
      const email = params.get("email") ?? "";
      const name = params.get("name") ?? "";
      const credits = parseInt(params.get("credits") ?? "0", 10);
      if (email && credits > 0) {
        setSession({ email, name, credits });
      }
      return;
    }

    // Path 2: fresh load — check if email param present (legacy support)
    const email = params.get("email");
    const name = params.get("name") ?? "";
    if (!email) return;

    setLoading(true);
    api.credits
      .get(email)
      .then((data) => {
        if (data.credits > 0) {
          setSession({ email, name, credits: data.credits });
        }
      })
      .catch(() => {
        // Silently fail — user stays in browse mode
      })
      .finally(() => setLoading(false));
  }, [params]);

  /** Creates a brand-new session (e.g. when modal confirms existing credits). */
  function startSession(student: { email: string; name: string; credits: number }) {
    setSession(student);
  }

  function updateCredits(remaining: number) {
    if (!session) return;
    if (remaining > 0) {
      setSession({ ...session, credits: remaining });
    } else {
      setSession(null);
    }
  }

  function clearSession() {
    setSession(null);
    router.push("/");
  }

  return { session, loading, startSession, updateCredits, clearSession };
}
