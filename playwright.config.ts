/**
 * playwright.config.ts
 *
 * TEST-02: Playwright E2E configuration.
 *
 * Local dev — start all three before running tests:
 *   1. npm run dev
 *   2. stripe listen --forward-to localhost:3000/api/stripe/webhook
 *      (required for booking-pack and booking-single — delivers Stripe webhooks locally)
 *   3. E2E_MODE=true E2E_EMAILS=e2e-test@example.com npm run test:e2e
 *
 * CI (local server mode — no E2E_BASE_URL):
 *   e2e.yml installs the Stripe CLI and runs stripe listen in the background.
 *
 * CI (Vercel preview mode — E2E_BASE_URL set):
 *   Stripe sends webhooks directly to the preview URL; no CLI needed.
 *   webServer is skipped; tests run against the external URL.
 */

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Start the dev server automatically when running locally (no E2E_BASE_URL set).
  // In CI against a Vercel preview, the URL is provided externally.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
