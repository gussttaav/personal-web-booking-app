/**
 * e2e/reschedule.spec.ts
 *
 * TEST-02: Reschedule an existing booking.
 *
 * Flow:
 *   1. Authenticated user creates a free booking via API to get a cancelToken
 *      (the cancelToken doubles as the reschedule token)
 *   2. Navigates to /?reschedule=free15min&token=<cancelToken>
 *      (this is the URL format injected by confirmation email links)
 *   3. The useRescheduleIntent hook fires, activating the reschedule flow
 *   4. The session picker / booking overlay opens automatically
 *   5. User picks a new slot and confirms
 *   6. Asserts redirect to /reserva-confirmada
 */

import { test, expect } from "@playwright/test";
import { loginAs, E2E_USER } from "./fixtures/auth";

test.describe("Reschedule existing booking", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, E2E_USER.email, E2E_USER.name);
  });

  test("student reschedules a free session via the reschedule URL", async ({ page }) => {
    // Create a free booking to get a cancel/reschedule token
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    const start = tomorrow.toISOString();

    const end = new Date(tomorrow);
    end.setMinutes(end.getMinutes() + 15);

    const bookRes = await page.request.post("/api/book", {
      data: {
        startIso:    start,
        endIso:      end.toISOString(),
        sessionType: "free15min",
        note:        "E2E reschedule test — original booking",
        timezone:    "Europe/Madrid",
      },
      headers: {
        Origin: process.env.E2E_BASE_URL ?? "http://localhost:3000",
      },
    });

    if (!bookRes.ok()) {
      test.skip(true, `Could not create booking for reschedule test: ${bookRes.status()}`);
      return;
    }

    const { cancelToken } = await bookRes.json();
    expect(cancelToken).toBeTruthy();

    // Navigate with reschedule URL params — these are what the email link uses.
    // The hook reads ?reschedule=free15min&token=<cancelToken> and opens the picker.
    await page.goto(`/?reschedule=free15min&token=${encodeURIComponent(cancelToken)}`);

    // The reschedule intent hook fires and the weekly calendar or session picker opens.
    // Wait for a slot to appear (calendar rendered in the booking overlay).
    const firstSlot = page.getByRole("button", { name: /\d{2}:\d{2}/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 20_000 });
    await firstSlot.click();

    // Confirm the reschedule
    const confirmBtn = page.getByRole("button", { name: /confirmar/i });
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    await confirmBtn.click();

    // Should reach the confirmation page
    await expect(page).toHaveURL(/\/reserva-confirmada/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /reserva confirmada/i }),
    ).toBeVisible();
  });
});
