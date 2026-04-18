/**
 * GET /api/admin/failed-bookings  — list dead-letter entries
 * POST /api/admin/failed-bookings — retry a failed booking by stripeSessionId
 *
 * REL-03 — Dead-letter recovery API.
 *
 * Both endpoints require the authenticated user to be in ADMIN_EMAILS.
 * The POST handler reuses processSingleSession from the webhook so recovery
 * applies identical booking logic (slot re-check, idempotency, calendar,
 * QStash, emails). On success the dead-letter entry is removed from Redis;
 * on failure it is preserved so the admin can retry again later.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { kv } from "@/lib/redis";
import { stripe } from "@/lib/stripe";
import { isAdmin } from "@/lib/admin";
import { log } from "@/lib/logger";
import {
  processSingleSession,
  type SingleSessionInput,
} from "@/lib/single-session";

interface DeadLetterRecord {
  stripeSessionId: string;
  email:           string;
  startIso:        string;
  failedAt:        string;
  error:           string;
}

// ── GET — list all failed bookings ────────────────────────────────────────────

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const keys: string[] = [];
  let cursor: string | number = 0;
  do {
    const result: [string | number, string[]] = await kv.scan(cursor, { match: "failed:booking:*", count: 100 });
    keys.push(...result[1]);
    cursor = result[0];
  } while (cursor !== 0 && cursor !== "0");

  const entries = await Promise.all(
    keys.map(async (k) => {
      const record = await kv.get<DeadLetterRecord>(k);
      return { key: k, record };
    })
  );

  log("info", "Admin listed failed bookings", { service: "admin", count: entries.length, email: session.user.email });
  return NextResponse.json({ entries });
}

// ── POST — retry a specific failed booking ────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { stripeSessionId } = body;

  if (!stripeSessionId || typeof stripeSessionId !== "string") {
    return NextResponse.json({ error: "stripeSessionId required" }, { status: 400 });
  }

  const key    = `failed:booking:${stripeSessionId}`;
  const record = await kv.get<DeadLetterRecord>(key);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  log("info", "Admin retrying failed booking", { service: "admin", stripeSessionId, email: session.user.email });

  // Fetch full metadata from Stripe so we can reconstruct SingleSessionInput.
  // stripeSessionId is either pi_xxx (payment_intent flow) or cs_xxx (legacy checkout).
  let input: SingleSessionInput;

  try {
    if (stripeSessionId.startsWith("pi_")) {
      const intent   = await stripe.paymentIntents.retrieve(stripeSessionId);
      const metadata = intent.metadata as Record<string, string>;
      input = {
        email:           metadata.student_email ?? "",
        name:            metadata.student_name  ?? "",
        startIso:        metadata.start_iso     ?? "",
        endIso:          metadata.end_iso       ?? "",
        duration:        metadata.session_duration ?? "1h",
        rescheduleToken: metadata.reschedule_token || null,
        idempotencyKey:  stripeSessionId,
        refundTarget:    { type: "payment_intent", id: stripeSessionId },
      };
    } else {
      const checkout = await stripe.checkout.sessions.retrieve(stripeSessionId);
      const metadata = (checkout.metadata ?? {}) as Record<string, string>;
      input = {
        email:           metadata.student_email ?? checkout.customer_email ?? "",
        name:            metadata.student_name  ?? "",
        startIso:        metadata.start_iso     ?? "",
        endIso:          metadata.end_iso       ?? "",
        duration:        metadata.session_duration ?? "1h",
        rescheduleToken: metadata.reschedule_token || null,
        idempotencyKey:  stripeSessionId,
        refundTarget:    { type: "payment_intent", id: checkout.payment_intent as string },
      };
    }
  } catch (err) {
    log("error", "Failed to retrieve Stripe entity for retry", { service: "admin", stripeSessionId, error: String(err) });
    return NextResponse.json({ ok: false, error: "Failed to retrieve Stripe data" }, { status: 502 });
  }

  // Delegate to the same processing function used by the webhook.
  // Returns null on success, a Response on any early-exit path.
  const result = await processSingleSession(input);

  if (result === null) {
    await kv.del(key);
    log("info", "Dead-letter entry cleared after successful retry", { service: "admin", stripeSessionId });
    return NextResponse.json({ ok: true });
  }

  // processSingleSession returned a response — booking did not complete (or was
  // already processed). Parse the body to surface a useful error message.
  let detail = "Retry did not complete";
  try {
    const json = await result.json() as Record<string, unknown>;
    if (typeof json.warning === "string") detail = json.warning;
    else if (typeof json.error === "string") detail = json.error;
  } catch {}

  log("warn", "Dead-letter retry did not succeed", { service: "admin", stripeSessionId, detail });
  return NextResponse.json({ ok: false, error: detail }, { status: 500 });
}
