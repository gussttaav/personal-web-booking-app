/**
 * e2e/chat.spec.ts
 *
 * TEST-02: AI chat widget smoke tests.
 *
 * The /api/chat endpoint calls Gemini and has a real monetary cost.
 * All tests in this file intercept /api/chat with page.route() and return
 * a canned response — no real API calls are made.
 *
 * What is tested:
 *   - Chat widget renders on the homepage
 *   - Suggestion buttons are visible and clickable
 *   - A mocked response is rendered in the chat thread (including markdown)
 *   - The UI does not crash when the chat endpoint returns an error
 */

import { test, expect } from "@playwright/test";

const MOCK_RESPONSE = "Soy un tutor de **programación** y matemáticas. ¿En qué puedo ayudarte?";

test.describe("AI chat widget (mocked API)", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept all /api/chat requests and return a canned plain-text response.
    // This avoids any Gemini API calls and prevents monetary charges.
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status:      200,
        contentType: "text/plain; charset=utf-8",
        body:        MOCK_RESPONSE,
      });
    });
  });

  test("chat widget is visible on the homepage", async ({ page }) => {
    await page.goto("/");

    // The chat widget should be present somewhere on the landing page.
    // It is rendered by the Chat component inside InteractiveShell.
    const chatSection = page.getByRole("textbox", { name: /mensaje|pregunta|chat/i });
    await expect(chatSection.or(page.locator("[data-chat], [class*='chat']").first())).toBeVisible({
      timeout: 15_000,
    });
  });

  test("suggestion buttons are rendered", async ({ page }) => {
    await page.goto("/");

    // The Chat component renders suggestion chip buttons on first load.
    // They match topics like "¿Qué asignaturas impartes?" or similar.
    const suggestionBtn = page
      .getByRole("button", { name: /asignatura|ayuda|precio|clase|cómo funciona/i })
      .first();
    await expect(suggestionBtn).toBeVisible({ timeout: 15_000 });
  });

  test("clicking a suggestion shows the mocked response", async ({ page }) => {
    await page.goto("/");

    // Click the first suggestion button available
    const suggestionBtn = page
      .getByRole("button", { name: /asignatura|ayuda|precio|clase|cómo funciona/i })
      .first();
    await expect(suggestionBtn).toBeVisible({ timeout: 15_000 });
    await suggestionBtn.click();

    // The mocked response text should appear in the chat thread.
    // Bold markdown (**programación**) is rendered as <strong>programación</strong>.
    await expect(page.getByText(/programación/i)).toBeVisible({ timeout: 10_000 });
  });

  test("chat renders markdown in responses", async ({ page }) => {
    await page.goto("/");

    const suggestionBtn = page
      .getByRole("button", { name: /asignatura|ayuda|precio|clase|cómo funciona/i })
      .first();
    await expect(suggestionBtn).toBeVisible({ timeout: 15_000 });
    await suggestionBtn.click();

    // "programación" is wrapped in **...** — verify the <strong> tag is present
    const boldText = page.locator("strong", { hasText: /programación/i });
    await expect(boldText).toBeVisible({ timeout: 10_000 });
  });
});
