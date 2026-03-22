/**
 * instrumentation.ts — Next.js server startup hook
 *
 * OBS-03: Next.js calls register() once when the server process starts,
 * before any request is handled. This is the right place to validate that
 * all required environment variables are present and structurally correct,
 * so a misconfigured deployment fails immediately with a clear error message
 * rather than silently producing wrong behaviour on the first real request.
 *
 * How to enable (next.config.mjs):
 *   The instrumentation hook is enabled by default in Next.js 14+ App Router.
 *   No configuration change is needed — placing this file at the project root
 *   (next to next.config.mjs) is sufficient.
 *
 * On failure:
 *   The process throws synchronously during startup. Vercel will mark the
 *   deployment as failed and show the error message in the build/function log,
 *   preventing the broken version from receiving traffic.
 */

export async function register() {
  // Only run on the Node.js runtime (not Edge). The environment variables
  // being checked are only needed server-side.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateEnv } = await import("@/lib/startup-checks");
  validateEnv();
}
