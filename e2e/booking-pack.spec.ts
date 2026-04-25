/**
 * e2e/booking-pack.spec.ts
 *
 * TEST-02: Pack purchase → book a session → cancel it flow.
 *
 * Flow:
 *   1. Authenticated user lands on the homepage
 *   2. Clicks "Comprar pack" (Pack Esencial — 5 sessions) — the button text,
 *      not the card title "Pack Esencial" which is a <div>, not a <button>
 *   3. Enters Stripe test card details in the embedded Elements iframe
 *   4. Completes payment and waits for SSE credit confirmation on /pago-exitoso
 *   5. Books a pack session using the new credits
 *   6. Navigates to /area-personal and asserts the booking is listed (NextSessionCard)
 *   7. Cancels inline via NextSessionCard and asserts card disappears
 */

import { test, expect } from "@playwright/test";
import { loginAs, E2E_USER } from "./fixtures/auth";

test.describe("Pack purchase + book + cancel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, E2E_USER.email, E2E_USER.name);
  });

  test("student purchases Pack Esencial, books a session, then cancels it", async ({ page }) => {
    await page.goto("/");

    // Wait for pack cards to load.
    // The PackCard button says "Comprar pack · €XX" — the card title "Pack Esencial"
    // is a <div>, not the button. Use the first "Comprar pack" button (Pack Esencial).
    await expect(page.getByRole("button", { name: /comprar pack/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    // Click Pack Esencial (first / cheapest pack)
    await page.getByRole("button", { name: /comprar pack/i }).first().click();

    // PackModal opens after the PI is pre-fetched — wait for the dialog to appear,
    // then wait for the Stripe PaymentElement iframe to fully mount.
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 20_000 });

    // Stripe PaymentElement renders inside an iframe whose name starts with
    // "__privateStripeFrame". Use frameLocator so Playwright retries automatically.
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    const cardNumber = stripeFrame.locator('input[name="number"], input[autocomplete="cc-number"]');
    await expect(cardNumber).toBeVisible({ timeout: 15_000 });

    await cardNumber.fill("4242424242424242");
    await stripeFrame.locator('input[name="expiry"], input[autocomplete="cc-exp"]').fill("12/30");
    await stripeFrame.locator('input[name="cvc"], input[autocomplete="cc-csc"]').fill("123");

    // Submit the payment
    await page.getByRole("button", { name: /^pagar$/i }).click();

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

    // Book a pack session (available because we now have credits).
    // The PackCard renders "Reservar clase" (not "Comprar pack") when credits > 0.
    // A hero-section CTA also matches /reservar/i but opens the session-picker
    // modal instead — so we must target the exact text "Reservar clase".
    await page.getByRole("button", { name: /reservar clase/i }).first().click();

    // Navigate to next week for guaranteed future slots
    await page.getByRole("button", { name: /semana siguiente/i }).click();

    // Availability fetch can take > 15 s on a cold dev server — allow 25 s.
    const firstSlot = page.getByRole("button", { name: /\d{2}:\d{2}/ }).first();
    await expect(firstSlot).toBeVisible({ timeout: 25_000 });

    // BookingModeView uses 2-click selection (no "Continuar" button):
    // 1st click focuses the slot; 2nd click on the same slot confirms it → ConfirmPanel.
    await firstSlot.click();
    await firstSlot.click();

    const confirmBtn = page.getByRole("button", { name: /confirmar/i });
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    await confirmBtn.click();

    // Pack session booking shows an inline success banner ("¡Clase reservada!") —
    // the overlay stays open so the user can book another slot.
    await expect(page.getByText(/clase reservada/i)).toBeVisible({ timeout: 30_000 });

    // Navigate to personal area — NextSessionCard shows "Próxima clase"
    await page.goto("/area-personal");
    await expect(page.getByText(/próxima clase/i)).toBeVisible({ timeout: 15_000 });

    // Cancel the booking via the "Cancelar" action button inside NextSessionCard
    await page.getByRole("button", { name: /cancelar/i }).first().click();

    // Inline confirm panel within NextSessionCard
    await expect(page.getByRole("button", { name: /sí, cancelar/i })).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: /sí, cancelar/i }).click();

    // Cancellation is inline — NextSessionCard disappears once bookings refresh
    await expect(page.getByText(/próxima clase/i)).not.toBeVisible({ timeout: 30_000 });
  });
});
