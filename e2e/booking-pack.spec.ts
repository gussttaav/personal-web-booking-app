/**
 * e2e/booking-pack.spec.ts
 *
 * TEST-02: Pack purchase → book a session → cancel it flow.
 *
 * Flow:
 *   1. Authenticated user lands on the homepage
 *   2. Clicks the "Pack Esencial" (5 sessions) card
 *   3. Enters Stripe test card details in the embedded Elements iframe
 *   4. Completes payment and waits for SSE credit confirmation on /pago-exitoso
 *   5. Books a pack session using the new credits
 *   6. Navigates to /area-personal and asserts the booking is visible
 *   7. Cancels the booking and asserts credit is restored
 */

import { test, expect } from "@playwright/test";
import { loginAs, E2E_USER } from "./fixtures/auth";

test.describe("Pack purchase + book + cancel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, E2E_USER.email, E2E_USER.name);
  });

  test("student purchases Pack Esencial, books a session, then cancels it", async ({ page }) => {
    await page.goto("/");

    // Wait for pack cards to load
    await expect(page.getByRole("button", { name: /pack esencial/i })).toBeVisible({
      timeout: 15_000,
    });

    // Click Pack Esencial (5 sessions)
    await page.getByRole("button", { name: /pack esencial/i }).click();

    // PackModal opens — the Stripe payment form should appear
    // The embedded Stripe Elements iframe takes a moment to load
    const stripeFrame = page
      .frameLocator("iframe")
      .filter({ hasText: /card number|número de tarjeta/i })
      .first();

    // Fallback: try standard stripe iframe selector
    const cardNumberFrame = page.frameLocator('iframe[name*="stripe"][title*="number" i]').first();

    // Fill in Stripe test card
    await page.waitForTimeout(2_000); // Stripe Elements init time
    const cardInput = page.frameLocator('iframe[name*="__privateStripeFrame"]').first()
      .locator('[name="number"]');

    // Use a more resilient Stripe iframe selector
    const stripeIframe = page.frameLocator('iframe[allow*="payment"]').first();
    await stripeIframe.locator('[placeholder*="1234"], [autocomplete="cc-number"], [name="cardnumber"]').fill("4242424242424242").catch(() => {
      // Stripe Elements may use a different frame structure
    });

    // Direct iframe number field approach (Stripe test mode)
    // The exact iframe structure varies; we use the number + expiry + cvc fields
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

    // Submit the payment
    await page.getByRole("button", { name: /pagar|completar pago|confirmar pago/i }).click();

    // Wait for redirect to /pago-exitoso and SSE credit confirmation
    await expect(page).toHaveURL(/\/pago-exitoso/, { timeout: 30_000 });
    await expect(
      page.getByText(/crédito|clase|pack/i),
    ).toBeVisible({ timeout: 30_000 });

    // Navigate back to book a session using the new credits
    await page.goto("/");
    await expect(page.getByRole("button", { name: /encuentro inicial/i })).toBeVisible({
      timeout: 15_000,
    });

    // Book a pack session (available because we now have credits)
    await page.getByRole("button", { name: /reservar/i }).first().click();

    const firstSlot = page.getByRole("button", { name: /\d{2}:\d{2}/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 15_000 });
    await firstSlot.click();

    await page.getByRole("button", { name: /confirmar/i }).click();
    await expect(page).toHaveURL(/\/reserva-confirmada/, { timeout: 30_000 });

    // Navigate to personal area — booking should be listed
    await page.goto("/area-personal");
    await expect(page.getByText(/próxima sesión|próximo encuentro|clase reservada/i)).toBeVisible({
      timeout: 15_000,
    });

    // Cancel the booking
    await page.getByRole("button", { name: /cancelar/i }).first().click();

    // Confirm the cancellation on /cancelar
    await expect(page.getByRole("button", { name: /sí, cancelar/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: /sí, cancelar/i }).click();

    // Assert cancellation success
    await expect(
      page.getByRole("heading", { name: /reserva cancelada/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Credit restored message
    await expect(page.getByText(/crédito.*devuelto|devuelto.*pack/i)).toBeVisible();
  });
});
