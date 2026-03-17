/**
 * POST /api/cal/webhook
 *
 * Receives booking lifecycle events from Cal.com.
 *
 * Events handled:
 *   BOOKING_CANCELLED  — pack class: restore 1 credit to the student
 *                      — single session: notify Gustavo by email (no auto-refund)
 *   BOOKING_RESCHEDULED — no credit change needed (same class, different time)
 *
 * Security: Cal.com signs every request with HMAC-SHA256.
 * Header: X-Cal-Signature-256  →  "sha256=<hex>"
 * We verify it against CAL_WEBHOOK_SECRET before processing anything.
 *
 * Setup (one-time, see instructions below):
 *   CAL_WEBHOOK_SECRET=<secret you choose in Cal.com settings>
 *   NOTIFY_EMAIL=<your email — receives single-session cancellation alerts>
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { restoreCredit } from "@/lib/kv";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalAttendee {
  email: string;
  name: string;
}

interface CalWebhookPayload {
  type: string;           // Cal.com event type slug e.g. "reunion-de-1-hora"
  title: string;
  startTime: string;
  endTime: string;
  uid: string;            // booking uid
  cancellationReason?: string;
  attendees: CalAttendee[];
}

interface CalWebhookBody {
  triggerEvent: "BOOKING_CANCELLED" | "BOOKING_CREATED" | string;
  createdAt: string;
  payload: CalWebhookPayload;
}

// ─── Signature verification ───────────────────────────────────────────────────

function verifyCalSignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  // Header format: "sha256=<hex digest>"
  const receivedHash = header.startsWith("sha256=") ? header.slice(7) : header;

  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch {
    return false;
  }
}

// ─── Email notification (single-session cancellations) ───────────────────────
// Uses the Resend API — add RESEND_API_KEY to your env vars, or swap this
// for any email provider you prefer (nodemailer, SendGrid, etc.).

async function notifyCancellation(
  attendeeEmail: string,
  attendeeName: string,
  eventTitle: string,
  startTime: string,
  reason?: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) {
    // Log to server console if email is not configured — still useful in Vercel logs
    console.warn(
      "[cal-webhook] RESEND_API_KEY or NOTIFY_EMAIL not set. " +
      "Cancellation notification not sent."
    );
    console.info(
      `[cal-webhook] Cancelled single session: ${attendeeName} <${attendeeEmail}> ` +
      `· ${eventTitle} · ${startTime}` +
      (reason ? ` · Reason: ${reason}` : "")
    );
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: notifyEmail,
      to: notifyEmail,
      subject: `❌ Sesión cancelada — ${attendeeName}`,
      html: `
        <p><strong>Sesión individual cancelada</strong></p>
        <ul>
          <li><strong>Alumno:</strong> ${attendeeName} (${attendeeEmail})</li>
          <li><strong>Sesión:</strong> ${eventTitle}</li>
          <li><strong>Fecha:</strong> ${new Date(startTime).toLocaleString("es-ES")}</li>
          ${reason ? `<li><strong>Motivo:</strong> ${reason}</li>` : ""}
        </ul>
        <p>Gestiona el reembolso manualmente si procede.</p>
      `,
    }),
  });
}

// ─── Helpers — detect booking type from the Cal.com event type slug ───────────
// Pack class slugs contain the Cal event configured in CAL_EVENTS.packBooking.
// Single sessions use the other slugs (15min, 1h, 2h).
// Adjust these checks if your slugs differ.

function isPackBooking(eventTypeSlug: string): boolean {
  const packSlug =
    process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "reunion-de-1-hora";
  // The pack slug is the same as the 1-hour session slug by default.
  // To disambiguate, create a dedicated "pack" event type in Cal.com
  // (e.g. "pack-clase") and update NEXT_PUBLIC_CAL_EVENT_SLUG accordingly.
  return eventTypeSlug.includes(packSlug.split("/")[1] ?? packSlug);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[cal-webhook] CAL_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("X-Cal-Signature-256");

  if (!verifyCalSignature(body, signature, secret)) {
    console.warn("[cal-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: CalWebhookBody;
  try {
    event = JSON.parse(body) as CalWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { triggerEvent, payload } = event;
  const attendee = payload.attendees?.[0];

  if (!attendee?.email) {
    console.warn("[cal-webhook] No attendee email in payload", { triggerEvent });
    return NextResponse.json({ received: true, warning: "No attendee email" });
  }

  // ── BOOKING_CANCELLED ────────────────────────────────────────────────────
  if (triggerEvent === "BOOKING_CANCELLED") {
    const isPack = isPackBooking(payload.type);

    if (isPack) {
      // Restore 1 credit to the student's pack
      const result = await restoreCredit(attendee.email);
      if (result.ok) {
        console.info(
          `[cal-webhook] Credit restored: ${attendee.email} → ${result.credits} remaining`
        );
      } else {
        // Student may not have a KV record (e.g. free session or expired pack).
        // Log but don't error — Cal.com would retry on non-2xx.
        console.warn(
          `[cal-webhook] Could not restore credit for ${attendee.email} — no active pack found`
        );
      }
    } else {
      // Single session — notify Gustavo, handle refund manually
      await notifyCancellation(
        attendee.email,
        attendee.name,
        payload.title,
        payload.startTime,
        payload.cancellationReason
      );
    }
  }

  return NextResponse.json({ received: true });
}
