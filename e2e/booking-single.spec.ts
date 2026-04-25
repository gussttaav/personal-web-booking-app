/**
 * e2e/booking-single.spec.ts
 *
 * TEST-02: Single paid session (1h) purchase flow.
 *
 * Flow:
 *   1. Authenticated user lands on the homepage
 *   2. Clicks "Sesión de 1 hora"
 *   3. Navigates to next week and picks a slot (1st click = focus → "Continuar" = select)
 *   4. Review step: clicks "Confirmar pago" → Stripe PaymentElement mounts
 *   5. Fills Stripe test card details
 *   6. Clicks "Pagar" → asserts redirect to /sesion-confirmada
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

    // Navigate to next week for guaranteed future slots
    await page.getByRole("button", { name: /semana siguiente/i }).click();

    // Pick the first available slot
    const firstSlot = page.getByRole("button", { name: /\d{2}:\d{2}/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15_000 });

    // 1st click focuses the slot; "Continuar" confirms the selection
    await firstSlot.click();
    await page.getByRole("button", { name: /continuar/i }).click();

    // Review step: "Confirmar pago" transitions to the Stripe payment form
    await expect(
      page.getByRole("button", { name: /confirmar pago/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /confirmar pago/i }).click();

    // Wait for the Stripe PaymentElement iframe to fully mount
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    const cardNumber = stripeFrame.locator('input[name="number"], input[autocomplete="cc-number"]');
    await expect(cardNumber).toBeVisible({ timeout: 15_000 });

    await cardNumber.fill("4242424242424242");
    await stripeFrame.locator('input[name="expiry"], input[autocomplete="cc-exp"]').fill("12/30");
    await stripeFrame.locator('input[name="cvc"], input[autocomplete="cc-csc"]').fill("123");

    // Submit Stripe payment
    await page.getByRole("button", { name: /^pagar$/i }).click();

    // Should reach the payment confirmation page
    await expect(page).toHaveURL(/\/sesion-confirmada/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /pago confirmado/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
