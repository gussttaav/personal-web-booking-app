/**
 * e2e/global-setup.ts
 *
 * TEST-02: Runs once before all Playwright tests.
 *
 * Applies pending Supabase migrations to the test database so local E2E runs
 * always reflect the current schema — the same guarantee CI gets from the
 * dedicated "Apply migrations" step in e2e.yml.
 *
 * Skipped automatically in CI (migrations already applied by e2e.yml) and in
 * Vercel preview mode (E2E_BASE_URL set — remote URL, no local DB to migrate).
 *
 * Requires SUPABASE_DB_URL in .env.e2e.local.
 *
 * IMPORTANT — use the session-mode pooler URL, not the direct URL:
 *   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
 *   (Supabase dashboard → Settings → Database → Connection pooling → Session mode)
 *
 * The direct URL (db.[ref].supabase.co) resolves to IPv6 on some regions and
 * will fail with "network is unreachable" on ISPs without IPv6 support.
 * The session-mode pooler is always IPv4 and supports DDL (migrations).
 */

import { spawnSync }                from "child_process";
import { existsSync, readFileSync } from "fs";

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const result: Record<string, string> = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) {
      const raw = match[2].trim();
      result[match[1].trim()] = raw.replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

export default async function globalSetup(): Promise<void> {
  if (process.env.CI || process.env.E2E_BASE_URL) return;

  const env   = loadEnvFile(".env.e2e.local");
  const dbUrl = env["SUPABASE_DB_URL"];

  if (!dbUrl) {
    console.warn(
      "\n[e2e] Warning: SUPABASE_DB_URL not set in .env.e2e.local — " +
      "migrations were NOT applied to the test database.\n" +
      "Add the session-mode pooler URL:\n" +
      "  SUPABASE_DB_URL=postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:5432/postgres\n",
    );
    return;
  }

  console.log("[e2e] Applying migrations to test database...");

  const result = spawnSync("supabase", ["db", "push", "--db-url", dbUrl], {
    stdio: "inherit",
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    const isNetworkError = (result.stderr ?? "").includes("network is unreachable")
      || (result.stderr ?? "").includes("dial error")
      || (result.stderr ?? "").includes("failed to connect");

    const isNotFound = result.error?.message.includes("ENOENT");

    if (isNotFound) {
      throw new Error(
        "[e2e] Supabase CLI not found. Install it first:\n" +
        "  Linux:  https://supabase.com/docs/guides/cli/getting-started\n" +
        "  macOS:  brew install supabase/tap/supabase",
      );
    }

    if (isNetworkError) {
      throw new Error(
        "[e2e] Could not reach the test database — likely an IPv6 connectivity issue.\n" +
        "Use the session-mode pooler URL in .env.e2e.local (always IPv4):\n" +
        "  SUPABASE_DB_URL=postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:5432/postgres\n" +
        "  (Supabase dashboard → Settings → Database → Connection pooling → Session mode)",
      );
    }

    throw new Error("[e2e] Migration step failed — see output above for details.");
  }
}
