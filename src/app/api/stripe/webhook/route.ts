/**
 * POST /api/stripe/webhook
 *
 * Applied fixes (cumulative):
 *   Week 2 — ARCH-01: Uses shared stripe singleton from lib/stripe.ts
 *   Week 2 — ARCH-02: Uses shared kv from lib/redis.ts
 *   Week 2 — ARCH-05: Single-session idempotency key prevents duplicate bookings
 *   Week 3 — PAY-01:  Slot availability re-check before creating calendar event
 *   Week 3 — PAY-03:  Dead-letter pattern for persistent calendar failures
 *
 * PAY-01 — Slot re-check detail:
 *   There is a window between a user selecting a slot and their payment
 *   completing where another user can book the same slot. The webhook now
 *   queries getAvailableSlots() before creating the calendar event. If the
 *   slot is no longer free, the student is refunded automatically via Stripe
 *   and receives an apology email (not implemented here — add sendSlotTakenEmail
 *   to email.ts when ready). The 200 return tells Stripe not to retry.
 *
 * PAY-03 — Dead-letter detail:
 *   Returning 500 on every calendar failure causes Stripe to retry the webhook
 *   for up to 72 hours. If the failure is systemic (wrong service account key,
 *   Google API outage), the retries achieve nothing and prevent legitimate
 *   webhooks from being processed in order. The fix:
 *     1. Retry calendar creation up to 3 times with backoff internally.
 *     2. On total failure, write a `failed:booking:{stripeSessionId}` key to
 *        Redis for manual review, send an internal alert, then return 200 so
 *        Stripe stops retrying.
 *   The NOTIFY_EMAIL env var is used for the alert — the same address that
 *   receives new booking notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { kv } from "@/lib/redis";
import { addOrUpdateStudent } from "@/lib/kv";
import { getAvailableSlots, createCalendarEvent, createCancellationToken } from "@/lib/calendar";
import {
  sendConfirmationEmail,
  sendNewBookingNotificationEmail,
} from "@/lib/email";

// TTL for single-session idempotency keys (7 days — beyond Stripe's 72h retry window)
const SINGLE_SESSION_IDEMPOTENCY_TTL = 7 * 24 * 60 * 60;
// TTL for dead-letter records (30 days for manual review window)
const FAILED_BOOKING_TTL = 30 * 24 * 60 * 60;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * PAY-03: Retries an async operation up to maxAttempts times with linear
 * backoff. Returns the result on success, throws on total failure.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  label: string
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[webhook] ${label} attempt ${attempt}/${maxAttempts} failed:`, (err as Error).message);
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, attempt * 1000));
      }
    }
  }
  throw lastError;
}

/**
 * PAY-03: Writes a dead-letter record to Redis and sends an alert to the
 * admin email so a failed booking is never silently lost.
 */
async function writeDeadLetter(
  stripeSessionId: string,
  email: string,
  startIso: string,
  error: unknown
): Promise<void> {
  try {
    await kv.set(
      `failed:booking:${stripeSessionId}`,
      {
        stripeSessionId,
        email,
        startIso,
        failedAt: new Date().toISOString(),
        error:    String(error),
      },
      { ex: FAILED_BOOKING_TTL }
    );
    console.error(`[webhook] Dead-letter written for ${stripeSessionId}`);
  } catch (kvErr) {
    // If even Redis is down, at minimum the error is in the Vercel logs
    console.error("[webhook] Failed to write dead-letter record:", kvErr);
  }

  // Send alert to admin — best-effort, non-blocking
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (notifyEmail) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    process.env.RESEND_FROM ?? "onboarding@resend.dev",
          to:      notifyEmail,
          subject: `⚠️ Reserva fallida — acción manual requerida`,
          html: `<p>No se pudo crear el evento de calendario para la reserva <strong>${stripeSessionId}</strong>.</p>
                 <p>Email: ${email} · Slot: ${startIso}</p>
                 <p>Error: ${String(error)}</p>
                 <p>El alumno ha pagado. Gestiona el reembolso o crea el evento manualmente.</p>`,
        }),
      }).catch(() => {}); // fire-and-forget — we're already in an error path
    }
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session         = event.data.object as Stripe.Checkout.Session;
    const email           = session.metadata?.student_email ?? session.customer_email ?? "";
    const name            = session.metadata?.student_name ?? "";
    const checkoutType    = session.metadata?.checkout_type ?? "pack";
    const stripeSessionId = session.id;

    if (!email) {
      console.error("[webhook] Missing email in metadata");
      return NextResponse.json({ received: true, warning: "Missing email" });
    }

    // ── Pack payment ────────────────────────────────────────────────────────
    if (checkoutType === "pack") {
      const packSize = parseInt(session.metadata?.pack_size ?? "0", 10);
      if (!packSize) {
        return NextResponse.json({ received: true, warning: "Missing pack_size" });
      }
      try {
        // addOrUpdateStudent already checks stripeSessionId for idempotency
        await addOrUpdateStudent(email, name, packSize, `Pack ${packSize} clases`, stripeSessionId);
        console.info(`[webhook] Pack credits written: ${email} +${packSize}`);
      } catch (err) {
        console.error("[webhook] KV write failed:", err);
        return NextResponse.json({ received: false }, { status: 500 });
      }
    }

    // ── Single session payment ──────────────────────────────────────────────
    if (checkoutType === "single") {
      const startIso        = session.metadata?.start_iso;
      const endIso          = session.metadata?.end_iso;
      const duration        = session.metadata?.session_duration ?? "1h";
      const rescheduleToken = session.metadata?.reschedule_token || null;

      if (!startIso || !endIso) {
        console.error("[webhook] Missing slot timing in metadata");
        return NextResponse.json({ received: true, warning: "Missing slot timing" });
      }

      // ── Idempotency check (ARCH-05) ─────────────────────────────────────
      const idempotencyKey = `webhook:single:${stripeSessionId}`;
      const alreadyDone    = await kv.get(idempotencyKey);
      if (alreadyDone) {
        console.info(`[webhook] Duplicate single-session webhook skipped: ${stripeSessionId}`);
        return NextResponse.json({ received: true });
      }

      // ── PAY-01: Verify the slot is still free ───────────────────────────
      // Between the student selecting a slot and payment completing, another
      // student may have booked the same time. Re-check availability here
      // and refund automatically if the slot is gone.
      const slotDate          = startIso.slice(0, 10); // "YYYY-MM-DD"
      const durationMinutes   = duration === "2h" ? 120 : 60;
      const availableSlots    = await getAvailableSlots(slotDate, durationMinutes).catch(() => null);
      const slotStillFree     = availableSlots?.some(s => s.start === startIso) ?? true;
      // If getAvailableSlots throws (e.g. Google API down), we fall through
      // and attempt the booking — calendar.events.insert will fail on conflict.

      if (!slotStillFree) {
        console.warn(`[webhook] Slot no longer available — refunding: ${email} ${startIso}`);
        try {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            reason:         "duplicate",
          });
        } catch (refundErr) {
          console.error("[webhook] Auto-refund failed:", refundErr);
          // Even if the refund call fails, don't retry the whole webhook —
          // the slot conflict is not going to resolve itself. Log and move on;
          // the admin will see the failed booking in Stripe's dashboard.
        }
        // Return 200 — slot conflict is not a transient error Stripe can fix
        return NextResponse.json({ received: true, warning: "Slot unavailable — refund issued" });
      }

      // ── Reschedule: delete old event before creating new one ────────────
      if (rescheduleToken) {
        const {
          verifyCancellationToken,
          consumeCancellationToken,
          deleteCalendarEvent,
        } = await import("@/lib/calendar");

        const oldBooking = await verifyCancellationToken(rescheduleToken);
        if (oldBooking) {
          try { await deleteCalendarEvent(oldBooking.record.eventId); } catch {}
          await consumeCancellationToken(rescheduleToken);
        }
      }

      const SESSION_LABELS: Record<string, string> = {
        "1h": "Sesión individual · 1 hora",
        "2h": "Sesión individual · 2 horas",
      };
      const sessionLabel = SESSION_LABELS[duration] ?? "Sesión individual";
      const sessionType  = duration === "1h" ? "session1h" : "session2h";

      // ── PAY-03: Create calendar event with internal retry + dead-letter ──
      let eventId:    string;
      let meetLink:   string;
      let cancelToken: string;

      try {
        const result = await withRetry(
          () => createCalendarEvent({
            summary:     `${sessionLabel} — ${name}`,
            description: `Alumno: ${name} (${email})\nTipo: ${sessionLabel}\ngustavoai.dev`,
            startIso,
            endIso,
          }),
          3,
          "createCalendarEvent"
        );
        eventId  = result.eventId;
        meetLink = result.meetLink;

        cancelToken = await createCancellationToken({
          eventId,
          email,
          name,
          sessionType,
          startsAt: startIso,
          endsAt:   endIso,
        });
      } catch (err) {
        console.error("[webhook] Calendar event creation failed after retries:", err);

        // PAY-03: Write dead-letter record and alert admin, then return 200
        // so Stripe stops retrying (retries can't fix a systemic failure).
        await writeDeadLetter(stripeSessionId, email, startIso, err);
        return NextResponse.json({ received: true, warning: "Calendar creation failed — manual review required" });
      }

      // Mark as processed BEFORE sending emails so that if emails fail,
      // a Stripe retry won't create a duplicate calendar event.
      await kv.set(idempotencyKey, { processedAt: new Date().toISOString() }, {
        ex: SINGLE_SESSION_IDEMPOTENCY_TTL,
      });

      // ── Send emails ───────────────────────────────────────────────────────
      try {
        await Promise.all([
          sendConfirmationEmail({
            to:           email,
            studentName:  name,
            sessionLabel,
            startIso,
            endIso,
            meetLink,
            cancelToken,
            note:         null,
            studentTz:    null,
            sessionType,
          }),
          sendNewBookingNotificationEmail({
            studentEmail: email,
            studentName:  name,
            sessionLabel,
            startIso,
            endIso,
            meetLink,
            note:         null,
          }),
        ]);
      } catch (emailErr) {
        // Booking is confirmed and idempotency key is written.
        // Email failure is logged but does not affect the webhook response.
        console.error("[webhook] Email send failed:", emailErr);
      }

      console.info(`[webhook] Single session booked: ${email} ${startIso}`);
    }
  }

  return NextResponse.json({ received: true });
}
