"use client";

/**
 * useUserSession
 *
 * Fetches credits exactly once when the user first authenticates.
 * Also re-fetches silently when the browser tab regains visibility —
 * this handles the case where the user cancels a class via the Cal.com
 * email link (possibly in another tab or device) and then returns to
 * the site: they will see their restored credit without a manual refresh.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api-client";
import type { UserSession } from "@/types";

export function useUserSession() {
  const { data: googleSession, status } = useSession();
  const [packSession, setPackSession] = useState<UserSession | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // Track the email we last fetched for — prevents duplicate fetches
  // caused by NextAuth returning a new session object reference on every
  // render cycle even when the underlying data has not changed.
  const fetchedForEmail = useRef<string | null>(null);

  // ── Core fetch function ────────────────────────────────────────────────────

  const fetchCredits = useCallback(
    async (email: string, name: string) => {
      setCreditsLoading(true);
      try {
        const data = await api.credits.get();
        if (data.credits > 0) {
          setPackSession({
            email,
            name,
            credits: data.credits,
            packSize: data.packSize,
          });
        } else {
          setPackSession(null);
        }
      } catch {
        // Silently fail — user stays in browse mode without pack
        setPackSession(null);
      } finally {
        setCreditsLoading(false);
      }
    },
    []
  );

  // ── Initial fetch on authentication ───────────────────────────────────────
  // Fires exactly once per login session. Depends on the email string
  // (a stable primitive) rather than the session object reference
  // (unstable — NextAuth reconstructs it on every render cycle).

  useEffect(() => {
    const email = googleSession?.user?.email;
    const name  = googleSession?.user?.name ?? "";

    if (status !== "authenticated" || !email) return;
    if (fetchedForEmail.current === email) return;

    fetchedForEmail.current = email;
    fetchCredits(email, name);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, googleSession?.user?.email]);

  // ── Reset on sign-out ─────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") {
      fetchedForEmail.current = null;
      setPackSession(null);
    }
  }, [status]);

  // ── Visibility-based refresh ───────────────────────────────────────────────
  // When the user returns to this tab after being away (e.g. they clicked
  // the Cal.com cancellation link in their email, which restored a credit
  // server-side), silently re-fetch credits so the UI reflects the change
  // without requiring a manual page refresh.
  // Cost: 1 Upstash GET per tab-focus event, only when authenticated.

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;

      const email = googleSession?.user?.email;
      const name  = googleSession?.user?.name ?? "";
      if (status !== "authenticated" || !email) return;

      fetchCredits(email, name);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [status, googleSession?.user?.email, googleSession?.user?.name, fetchCredits]);

  // ── Imperative update (used after booking a class) ────────────────────────

  function updateCredits(remaining: number) {
    if (!packSession) return;
    if (remaining > 0) {
      setPackSession({ ...packSession, credits: remaining });
    } else {
      setPackSession(null);
    }
  }

  function clearPackSession() {
    setPackSession(null);
  }

  return {
    // Google identity (always available when signed in)
    googleUser: googleSession?.user ?? null,
    isSignedIn: status === "authenticated",
    isAuthLoading: status === "loading",

    // Pack credits session (only set when user has active credits)
    packSession,
    creditsLoading,
    updateCredits,
    clearPackSession,
  };
}
