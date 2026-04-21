// DB-04 — One-time backfill from Redis → Supabase. Run: npm run backfill (run ONCE; re-running duplicates audit_log entries).
import { kv } from "@/infrastructure/redis/client";
import { supabase } from "@/infrastructure/supabase/client";
import type { CreditRecord, BookingRecord, AuditEntry, PackSize } from "@/domain/types";

// ─── Credits ──────────────────────────────────────────────────────────────────

async function backfillCredits(): Promise<void> {
  let cursor = "0";
  let processed = 0;
  let inserted  = 0;
  let skipped   = 0;

  do {
    const [next, keys] = await kv.scan(cursor, { match: "credits:*", count: 100 });

    for (const redisKey of keys) {
      const record = await kv.get<CreditRecord>(redisKey);
      if (!record) continue;
      processed++;

      if (!record.stripeSessionId) {
        console.warn(`[credits] skip ${record.email}: no stripeSessionId`);
        skipped++;
        continue;
      }

      const packSize = record.packSize ?? inferPackSize(record.packLabel);
      if (!packSize) {
        console.warn(`[credits] skip ${record.email}: cannot infer pack_size from "${record.packLabel}"`);
        skipped++;
        continue;
      }

      const { data: user, error: userErr } = await supabase
        .from("users")
        .upsert({ email: record.email.toLowerCase().trim(), name: record.name }, { onConflict: "email" })
        .select("id")
        .single();

      if (userErr || !user) {
        console.error(`[credits] upsert user ${record.email}:`, userErr?.message);
        continue;
      }

      const { error } = await supabase.from("credit_packs").insert({
        user_id:           user.id,
        pack_size:         packSize,
        credits_remaining: record.credits,
        stripe_payment_id: record.stripeSessionId,
        expires_at:        record.expiresAt,
        source:            "redis",
      });

      if (!error) {
        inserted++;
      } else if (error.code !== "23505") {
        console.error(`[credits] insert pack ${record.email}:`, error.message);
      }
      // 23505 = unique_violation on stripe_payment_id → already backfilled, skip
    }

    cursor = next;
  } while (cursor !== "0");

  console.log(`[credits] processed=${processed} inserted=${inserted} skipped=${skipped}`);
}

function inferPackSize(label: string): PackSize | null {
  if (label.includes("10")) return 10;
  if (label.includes("5"))  return 5;
  return null;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

async function backfillBookings(): Promise<void> {
  let cursor = "0";
  let processed = 0;
  let inserted  = 0;

  do {
    const [next, keys] = await kv.scan(cursor, { match: "bookings:*", count: 100 });

    for (const setKey of keys) {
      const email  = setKey.replace(/^bookings:/, "").toLowerCase().trim();
      const tokens = await kv.zrange<string[]>(setKey, 0, -1);
      if (!tokens?.length) continue;

      const { data: user, error: userErr } = await supabase
        .from("users")
        .upsert({ email, name: "" }, { onConflict: "email" })
        .select("id")
        .single();

      if (userErr || !user) {
        console.error(`[bookings] upsert user ${email}:`, userErr?.message);
        continue;
      }

      for (const token of tokens) {
        const record = await kv.get<BookingRecord>(`cancel:${token}`);
        if (!record || record.used) continue; // expired TTL or already consumed
        processed++;

        const { error } = await supabase.from("bookings").upsert(
          {
            user_id:           user.id,
            session_type:      record.sessionType,
            starts_at:         record.startsAt,
            ends_at:           record.endsAt,
            status:            "confirmed",
            calendar_event_id: record.eventId,
            cancel_token:      token,
            source:            "redis",
          },
          { onConflict: "cancel_token" },
        );

        if (!error) {
          inserted++;
        } else {
          console.error(`[bookings] upsert token ${token}:`, error.message);
        }
      }
    }

    cursor = next;
  } while (cursor !== "0");

  console.log(`[bookings] processed=${processed} inserted=${inserted}`);
}

// ─── Audit ────────────────────────────────────────────────────────────────────

async function backfillAudit(): Promise<void> {
  let cursor = "0";
  let processed = 0;
  let inserted  = 0;

  do {
    const [next, keys] = await kv.scan(cursor, { match: "audit:*", count: 100 });

    for (const auditKey of keys) {
      const email = auditKey.replace(/^audit:/, "").toLowerCase().trim();
      const raw   = await kv.lrange<string>(auditKey, 0, 99);
      if (!raw?.length) continue;

      const { data: user, error: userErr } = await supabase
        .from("users")
        .upsert({ email, name: "" }, { onConflict: "email" })
        .select("id")
        .single();

      if (userErr || !user) {
        console.error(`[audit] upsert user ${email}:`, userErr?.message);
        continue;
      }

      for (const item of raw) {
        let entry: AuditEntry;
        try {
          entry = JSON.parse(typeof item === "string" ? item : JSON.stringify(item)) as AuditEntry;
        } catch {
          continue;
        }

        processed++;
        const { action, ts, ...rest } = entry;

        const { error } = await supabase.from("audit_log").insert({
          user_id:    user.id,
          action,
          details:    { ts, ...rest },
          created_at: ts,
        });

        if (!error) {
          inserted++;
        } else {
          console.error(`[audit] insert entry ${email}:`, error.message);
        }
      }
    }

    cursor = next;
  } while (cursor !== "0");

  console.log(`[audit] processed=${processed} inserted=${inserted}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Starting backfill…");
  await backfillCredits();
  await backfillBookings();
  await backfillAudit();
  console.log("Backfill complete.");
}

main().catch(err => { console.error(err); process.exit(1); });
