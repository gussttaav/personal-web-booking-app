/**
 * e2e/booking-free.spec.ts
 *
 * TEST-02: Free 15-min session ("Encuentro inicial") booking flow.
 *
 * Flow:
 *   1. Authenticated user lands on the homepage
 *   2. Clicks the "Encuentro inicial" session card
 *   3. Picks a date + first available slot in the weekly calendar
 *   4. Optionally adds a note and confirms
 *   5. Asserts redirect to /reserva-confirmada with success heading
 */

import { test, expect } from "@playwright/test";
import { loginAs, E2E_USER } from "./fixtures/auth";

test.describe("Free 15-min session booking", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, E2E_USER.email, E2E_USER.name);
  });

  test("student books a free encuentro inicial", async ({ page }) => {
    await page.goto("/");

    // Wait for the auth state to settle (skeleton cards replaced by real cards)
    await expect(page.getByRole("button", { name: /encuentro inicial/i })).toBeVisible({
      timeout: 15_000,
    });

    // Open the free session calendar
    await page.getByRole("button", { name: /encuentro inicial/i }).click();

    // The booking overlay / calendar should appear
    // Pick the first available time slot shown in the weekly calendar
    const firstSlot = page.getByRole("button", { name: /\d{2}:\d{2}/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15_000 });
    await firstSlot.click();

    // Confirm panel — optionally fill note and submit
    const confirmBtn = page.getByRole("button", { name: /confirmar/i });
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    await confirmBtn.click();

    // Should redirect to the confirmation page
    await expect(page).toHaveURL(/\/reserva-confirmada/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /reserva confirmada/i }),
    ).toBeVisible();
  });
});
