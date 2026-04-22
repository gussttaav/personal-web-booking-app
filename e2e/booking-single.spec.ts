/**
 * e2e/booking-single.spec.ts
 *
 * TEST-02: Single paid session (1h) purchase flow.
 *
 * Flow:
 *   1. Authenticated user lands on the homepage
 *   2. Clicks "Sesión de 1 hora"
 *   3. Picks a slot from the weekly calendar
 *   4. Enters Stripe test card in the payment form
 *   5. Completes payment → asserts redirect to /reserva-confirmada
 */

import { test, expect } from "@playwright/test";
import { loginAs, E2E_USER } from "./fixtures/auth";

test.describe("Single 1-hour session purchase", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, E2E_USER.email, E2E_USER.name);
  });

  test("student purchases a 1-hour session and reaches confirmation", async ({ page }) => {
    await page.goto("/");

    // Wait for session cards to appear (auth skeleton replaces with real data)
    await expect(page.getByRole("button", { name: /sesión de 1 hora/i })).toBeVisible({
      timeout: 15_000,
    });

    // Open the 1h session booking overlay
    await page.getByRole("button", { name: /sesión de 1 hora/i }).click();

    // Pick the first available slot in the weekly calendar
    const firstSlot = page.getByRole("button", { name: /\d{2}:\d{2}/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15_000 });
    await firstSlot.click();

    // A payment form (Stripe Elements) should appear for paid sessions
    // The form is embedded via SingleSessionBooking or checkout redirect
    await page.waitForTimeout(2_000); // allow Stripe Elements to mount

    // Fill card details across all Stripe sub-frames
    for (const frame of await page.frames()) {
      try {
        const numField = frame.locator('input[name="number"], input[autocomplete="cc-number"]');
        if (await numField.isVisible({ timeout: 500 })) {
          await numField.fill("4242424242424242");
          await frame.locator('input[name="expiry"], input[autocomplete="cc-exp"]').fill("12/30");
          await frame.locator('input[name="cvc"], input[autocomplete="cc-csc"]').fill("123");
          break;
        }
      } catch { /* try next frame */ }
    }

    // Submit payment
    await page.getByRole("button", { name: /pagar|confirmar pago|completar/i }).click();

    // Should reach booking confirmation
    await expect(page).toHaveURL(/\/reserva-confirmada/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /reserva confirmada/i }),
    ).toBeVisible();
  });
});
