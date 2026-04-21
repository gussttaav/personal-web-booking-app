// DB-04 — Reconciliation: Redis vs Supabase. Run: npm run reconcile. Exit 0 = clean, exit 1 = drift.
import { kv } from "@/infrastructure/redis/client";
import { supabase } from "@/infrastructure/supabase/client";
import type { CreditRecord, BookingRecord } from "@/domain/types";

interface CreditDrift {
  email:    string;
  redis:    number;
  supabase: number;
}

interface ReconciliationReport {
  credits: {
    missingInSupabase: string[];
    extraInSupabase:   string[];
    drift:             CreditDrift[];
  };
  bookings: {
    missingInSupabase: string[];
    extraInSupabase:   string[];
  };
  audit: {
    emailsWithMissingEntries: Array<{ email: string; redisCount: number; supabaseCount: number }>;
  };
}

// ─── Credits ──────────────────────────────────────────────────────────────────

async function reconcileCredits(): Promise<ReconciliationReport["credits"]> {
  const redisCredits = new Map<string, number>();
  let cursor = "0";

  do {
    const [next, keys] = await kv.scan(cursor, { match: "credits:*", count: 100 });

    for (const redisKey of keys) {
      const record = await kv.get<CreditRecord>(redisKey);
      if (!record) continue;
      if (new Date(record.expiresAt) <= new Date()) continue; // expired
      redisCredits.set(record.email.toLowerCase().trim(), record.credits);
    }

    cursor = next;
  } while (cursor !== "0");

  // Sum credits_remaining per user across all active, non-empty packs
  const { data: packs, error } = await supabase
    .from("credit_packs")
    .select("credits_remaining, users!inner(email)")
    .gt("expires_at", new Date().toISOString())
    .gt("credits_remaining", 0);

  if (error) throw error;

  const supabaseCredits = new Map<string, number>();
  for (const pack of packs ?? []) {
    const email = (pack.users as { email: string }).email.toLowerCase().trim();
    supabaseCredits.set(email, (supabaseCredits.get(email) ?? 0) + pack.credits_remaining);
  }

  const missingInSupabase: string[]      = [];
  const extraInSupabase:   string[]      = [];
  const drift:             CreditDrift[] = [];

  for (const [email, redisVal] of Array.from(redisCredits.entries())) {
    const sbVal = supabaseCredits.get(email);
    if (sbVal === undefined) missingInSupabase.push(email);
    else if (sbVal !== redisVal) drift.push({ email, redis: redisVal, supabase: sbVal });
  }
  for (const email of Array.from(supabaseCredits.keys())) {
    if (!redisCredits.has(email)) extraInSupabase.push(email);
  }

  return { missingInSupabase, extraInSupabase, drift };
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

async function reconcileBookings(): Promise<ReconciliationReport["bookings"]> {
  // Only compare upcoming bookings: Redis TTL covers future + active sessions,
  // so comparing against Supabase confirmed + starts_at >= now avoids false
  // positives from historical records that have naturally expired in Redis.
  const now = new Date().toISOString();

  const redisEventIds = new Set<string>();
  let cursor = "0";

  do {
    const [next, keys] = await kv.scan(cursor, { match: "bookings:*", count: 100 });

    for (const setKey of keys) {
      const tokens = await kv.zrange<string[]>(setKey, 0, -1);
      if (!tokens?.length) continue;

      for (const token of tokens) {
        const record = await kv.get<BookingRecord>(`cancel:${token}`);
        if (!record || record.used) continue;
        if (record.eventId) redisEventIds.add(record.eventId);
      }
    }

    cursor = next;
  } while (cursor !== "0");

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("calendar_event_id")
    .eq("status", "confirmed")
    .gte("starts_at", now)
    .not("calendar_event_id", "is", null);

  if (error) throw error;

  const supabaseEventIds = new Set<string>(
    (bookings ?? []).map(b => b.calendar_event_id as string).filter(Boolean),
  );

  const missingInSupabase: string[] = [];
  const extraInSupabase:   string[] = [];

  for (const id of Array.from(redisEventIds)) {
    if (!supabaseEventIds.has(id)) missingInSupabase.push(id);
  }
  for (const id of Array.from(supabaseEventIds)) {
    if (!redisEventIds.has(id)) extraInSupabase.push(id);
  }

  return { missingInSupabase, extraInSupabase };
}

// ─── Audit ────────────────────────────────────────────────────────────────────

async function reconcileAudit(): Promise<ReconciliationReport["audit"]> {
  const redisCounts = new Map<string, number>();
  let cursor = "0";

  do {
    const [next, keys] = await kv.scan(cursor, { match: "audit:*", count: 100 });

    for (const auditKey of keys) {
      const email = auditKey.replace(/^audit:/, "").toLowerCase().trim();
      const count = await kv.llen(auditKey);
      redisCounts.set(email, count);
    }

    cursor = next;
  } while (cursor !== "0");

  const emailsWithMissingEntries: ReconciliationReport["audit"]["emailsWithMissingEntries"] = [];

  for (const [email, redisCount] of Array.from(redisCounts.entries())) {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      if (redisCount > 0) {
        emailsWithMissingEntries.push({ email, redisCount, supabaseCount: 0 });
      }
      continue;
    }

    const { count: sbCount, error } = await supabase
      .from("audit_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) throw error;

    // Redis is capped at 100 and rolls over; Supabase accumulates indefinitely.
    // Only flag when Redis has MORE entries than Supabase (shadow-write failures).
    if (redisCount > (sbCount ?? 0)) {
      emailsWithMissingEntries.push({ email, redisCount, supabaseCount: sbCount ?? 0 });
    }
  }

  return { emailsWithMissingEntries };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const report: ReconciliationReport = {
    credits:  await reconcileCredits(),
    bookings: await reconcileBookings(),
    audit:    await reconcileAudit(),
  };

  console.log(JSON.stringify(report, null, 2));

  const hasDrift =
    report.credits.missingInSupabase.length       > 0 ||
    report.credits.extraInSupabase.length         > 0 ||
    report.credits.drift.length                   > 0 ||
    report.bookings.missingInSupabase.length      > 0 ||
    report.bookings.extraInSupabase.length        > 0 ||
    report.audit.emailsWithMissingEntries.length  > 0;

  if (hasDrift) {
    console.error("Drift detected");
    process.exit(1);
  } else {
    console.log("Stores are in sync");
    process.exit(0);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
