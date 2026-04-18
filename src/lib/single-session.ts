/**
 * lib/single-session.ts
 *
 * REL-03 — Extracted from the Stripe webhook route so that both the webhook
 * handler and the dead-letter recovery endpoint can share the same booking
 * logic. Next.js route files may only export HTTP method handlers, so any
 * shared function must live outside the route file.
 *
 * Previous location: src/app/api/stripe/webhook/route.ts
 * Consumers:
 *   - src/app/api/stripe/webhook/route.ts  (primary booking path)
 *   - src/app/api/admin/failed-bookings/route.ts  (recovery path)
 */

import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { stripe } from "@/lib/stripe";
import { kv } from "@/lib/redis";
import { getAvailableSlots, createCalendarEvent, createBookingTokens } from "@/lib/calendar";
import { sendConfirmationEmail, sendNewBookingNotificationEmail } from "@/lib/email";
import { log } from "@/lib/logger";
import { getSessionDurationWithGrace } from "@/lib/zoom";
import { qstash } from "@/lib/qstash";

export const SINGLE_SESSION_IDEMPOTENCY_TTL = 7 * 24 * 60 * 60;
export const FAILED_BOOKING_TTL             = 30 * 24 * 60 * 60;

export interface SingleSessionInput {
  email:           string;
  name:            string;
  startIso:        string;
  endIso:          string;
  duration:        string;
  rescheduleToken: string | null;
  idempotencyKey:  string;           // pi_xxx (new flow) or cs_xxx (legacy)
  refundTarget:    { type: "payment_intent"; id: string }
                 | { type: "charge";         id: string };
}

export async function withRetry<T>(
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
      log("warn", `${label} attempt failed`, { service: "webhook", attempt, maxAttempts, error: (err as Error).message });
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
  throw lastError;
}

export async function writeDeadLetter(
  stripeSessionId: string,
  email: string,
  startIso: string,
  error: unknown
): Promise<void> {
  try {
    await kv.set(
      `failed:booking:${stripeSessionId}`,
      { stripeSessionId, email, startIso, failedAt: new Date().toISOString(), error: String(error) },
      { ex: FAILED_BOOKING_TTL }
    );
    log("error", "Dead-letter written for failed booking", { service: "webhook", stripeSessionId, email, startIso });
  } catch (kvErr) {
    log("error", "Failed to write dead-letter record", { service: "webhook", stripeSessionId, error: String(kvErr) });
  }

  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (notifyEmail) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    process.env.RESEND_FROM ?? "onboarding@resend.dev",
          to:      notifyEmail,
          subject: `⚠️ Reserva fallida — acción manual requerida`,
          html: `<p>No se pudo crear el evento de calendario para la reserva <strong>${stripeSessionId}</strong>.</p>
                 <p>Email: ${email} · Slot: ${startIso}</p><p>Error: ${String(error)}</p>
                 <p>El alumno ha pagado. Gestiona el reembolso o crea el evento manualmente.</p>`,
        }),
      }).catch(() => {});
    }
  }
}

export async function issueRefund(
  target:         { type: "payment_intent" | "charge"; id: string },
  idempotencyKey: string
): Promise<void> {
  try {
    const params = target.type === "payment_intent"
      ? { payment_intent: target.id, reason: "duplicate" as const }
      : { charge:          target.id, reason: "duplicate" as const };
    await stripe.refunds.create(params);
  } catch (err) {
    log("error", "Auto-refund failed", { service: "webhook", idempotencyKey, error: String(err) });
  }
}

export async function processSingleSession(input: SingleSessionInput): Promise<Response | null> {
  const { email, name, startIso, endIso, duration, rescheduleToken, idempotencyKey } = input;

  if (!email) {
    log("error", "Missing email in single-session metadata", { service: "webhook", idempotencyKey });
    return NextResponse.json({ received: true, warning: "Missing email" });
  }
  if (!startIso || !endIso) {
    log("error", "Missing slot timing in webhook metadata", { service: "webhook", idempotencyKey });
    return NextResponse.json({ received: true, warning: "Missing slot timing" });
  }

  // Idempotency check
  const idempotencyRedisKey = `webhook:single:${idempotencyKey}`;
  const alreadyDone         = await kv.get(idempotencyRedisKey);
  if (alreadyDone) {
    log("info", "Duplicate single-session webhook skipped", { service: "webhook", idempotencyKey });
    return NextResponse.json({ received: true });
  }

  // Slot re-check (PAY-01)
  const slotDate        = startIso.slice(0, 10);
  const durationMinutes = duration === "2h" ? 120 : 60;
  const availableSlots  = await getAvailableSlots(slotDate, durationMinutes).catch(() => null);
  const slotStillFree   = availableSlots?.some(s => s.start === startIso) ?? true;

  if (!slotStillFree) {
    log("warn", "Slot no longer available — refunding", { service: "webhook", email, startIso, idempotencyKey });
    await issueRefund(input.refundTarget, idempotencyKey);
    return NextResponse.json({ received: true, warning: "Slot unavailable — refund issued" });
  }

  // Reschedule: delete old event
  if (rescheduleToken) {
    const { verifyCancellationToken, consumeCancellationToken, deleteCalendarEvent } = await import("@/lib/calendar");
    const oldBooking = await verifyCancellationToken(rescheduleToken);
    if (oldBooking) {
      const consumed = await consumeCancellationToken(rescheduleToken);
      if (consumed) {
        try { await deleteCalendarEvent(oldBooking.record.eventId); } catch {}
      }
    }
  }

  const SESSION_LABELS: Record<string, string> = {
    "1h": "Sesión individual · 1 hora",
    "2h": "Sesión individual · 2 horas",
  };
  const sessionLabel = SESSION_LABELS[duration] ?? "Sesión individual";
  const sessionType  = duration === "1h" ? "session1h" : "session2h";

  // Create calendar event with retry + dead-letter (PAY-03)
  let eventId:     string;
  let cancelToken: string;
  let joinToken:   string;

  try {
    const result = await withRetry(
      () => createCalendarEvent({
        summary:      `${sessionLabel} — ${name}`,
        description:  `Alumno: ${name} (${email})\nTipo: ${sessionLabel}\ngustavoai.dev`,
        startIso,
        endIso,
        sessionType,
        studentEmail: email,  // SEC-03
      }),
      3,
      "createCalendarEvent"
    );
    eventId = result.eventId;
    ({ cancelToken, joinToken } = await createBookingTokens({ eventId, email, name, sessionType, startsAt: startIso, endsAt: endIso }));
  } catch (err) {
    log("error", "Calendar event creation failed after retries", { service: "webhook", email, startIso, idempotencyKey, error: String(err) });
    await writeDeadLetter(idempotencyKey, email, startIso, err);
    return NextResponse.json({ received: true, warning: "Calendar creation failed — manual review required" });
  }

  await kv.set(idempotencyRedisKey, { processedAt: new Date().toISOString() }, { ex: SINGLE_SESSION_IDEMPOTENCY_TTL });

  const joinUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/sesion/${joinToken}`;

  // REL-01: QStash replaces setTimeout — fires reliably after the serverless
  // function has returned. Skipped in local dev because QStash (an external
  // service) cannot reach a loopback address. Failure is logged but does not
  // fail the webhook; the Zoom JWT TTL (1h) prevents indefinite session use.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  if (!baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1")) {
    const delaySeconds = getSessionDurationWithGrace(sessionType) * 60;
    await qstash.publishJSON({
      url:   `${baseUrl}/api/internal/zoom-terminate`,
      body:  { eventId },
      delay: delaySeconds,
    }).catch((err: unknown) => {
      log("error", "QStash schedule failed", { service: "webhook", eventId, error: String(err) });
    });
  }

  // REL-05: defer emails so the webhook response is returned immediately.
  waitUntil(
    Promise.all([
      sendConfirmationEmail({ to: email, studentName: name, sessionLabel, startIso, endIso, joinToken, cancelToken, note: null, studentTz: null, sessionType }),
      sendNewBookingNotificationEmail({ studentEmail: email, studentName: name, sessionLabel, startIso, endIso, joinUrl, note: null }),
    ]).catch((emailErr) => {
      log("error", "Email send failed after booking", { service: "webhook", email, idempotencyKey, error: String(emailErr) });
    })
  );

  log("info", "Single session booked", { service: "webhook", email, startIso });
  return null;
}
