/**
 * e2e/fixtures/auth.ts
 *
 * TEST-02: Auth helper for Playwright E2E tests.
 *
 * loginAs() calls the test-only /api/test/auth endpoint to set a real
 * NextAuth session cookie, bypassing Google OAuth. page.request shares
 * the browser cookie jar, so subsequent page.goto() calls are authenticated.
 */

import type { Page } from "@playwright/test";

export const E2E_USER = {
  email: "e2e-test@example.com",
  name:  "E2E Test",
};

export const E2E_ADMIN = {
  email: "e2e-admin@example.com",
  name:  "E2E Admin",
};

export async function loginAs(
  page: Page,
  email: string,
  name:  string,
): Promise<void> {
  const response = await page.request.post("/api/test/auth", {
    data: { email, name },
  });

  if (!response.ok()) {
    const body = await response.text().catch(() => "(no body)");
    throw new Error(
      `loginAs failed: ${response.status()} — ${body}`,
    );
  }
}
