/**
 * POST /api/book
 *
 * Unified booking endpoint for all session types.
 *
 * MIN NOTICE: the advance-booking guard now reads SCHEDULE.minNoticeHours
 * from booking-config (single source of truth) instead of a hardcoded "2".
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BookSchema } from "@/lib/schemas";
import { createCalendarEvent, createCancellationToken } from "@/lib/calendar";
import { decrementCredit } from "@/lib/kv";
import { sendConfirmationEmail, sendNewBookingNotificationEmail } from "@/lib/email";
import { log } from "@/lib/logger";
import { SCHEDULE } from "@/lib/booking-config";
import type { z } from "zod";

const SESSION_LABELS: Record<string, string> = {
  free15min: "Encuentro inicial gratuito · 15 min",
  session1h: "Sesión individual · 1 hora",
  session2h: "Sesión individual · 2 horas",
  pack:      "Clase de pack",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Autenticación requerida" }, { status: 401 });
  }

  const email = session.user.email;
  const name  = session.user.name ?? email;

  let body: z.infer<typeof BookSchema>;
  try {
    body = BookSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Datos de reserva inválidos" }, { status: 400 });
  }

  const { startIso, endIso, sessionType, note, timezone, rescheduleToken } = body;

  if (rescheduleToken) {
    const {
      verifyCancellationToken,
      consumeCancellationToken,
      deleteCalendarEvent,
    } = await import("@/lib/calendar");

    const oldBooking = await verifyCancellationToken(rescheduleToken);
    if (oldBooking) {
      try { await deleteCalendarEvent(oldBooking.record.eventId); } catch {}
      if (oldBooking.record.sessionType === "pack") {
        const { restoreCredit } = await import("@/lib/kv");
        await restoreCredit(email);
      }
      await consumeCancellationToken(rescheduleToken);
    }
  }

  // Guard: slot must be at least SCHEDULE.minNoticeHours in the future.
  // This is the backend source of truth — the frontend hides such slots
  // via the availability API, but we re-check here to be safe.
  const startsAt    = new Date(startIso);
  const minBookable = new Date(Date.now() + SCHEDULE.minNoticeHours * 60 * 60_000);
  if (startsAt < minBookable) {
    return NextResponse.json({ error: "Este horario ya no está disponible" }, { status: 409 });
  }

  if (sessionType === "pack") {
    const credit = await decrementCredit(email);
    if (!credit.ok) {
      return NextResponse.json({ error: "Sin créditos disponibles" }, { status: 400 });
    }
  }

  const sessionLabel = SESSION_LABELS[sessionType];
  let eventId:  string;
  let meetLink: string;

  try {
    const result = await createCalendarEvent({
      summary:     `${sessionLabel} — ${name}`,
      description: [
        `Alumno: ${name} (${email})`,
        `Tipo: ${sessionLabel}`,
        note ? `Motivo: ${note}` : null,
        `gustavoai.dev`,
      ].filter(Boolean).join("\n"),
      startIso,
      endIso,
    });
    eventId  = result.eventId;
    meetLink = result.meetLink;
  } catch (err) {
    log("error", "Calendar event creation failed", { service: "book", email, startIso, error: String(err) });
    if (sessionType === "pack") {
      const { restoreCredit } = await import("@/lib/kv");
      await restoreCredit(email);
    }
    return NextResponse.json({ error: "Error al crear el evento" }, { status: 500 });
  }

  const cancelToken = await createCancellationToken({
    eventId, email, name, sessionType, startsAt: startIso, endsAt: endIso,
  });

  async function sendWithRetry(fn: () => Promise<void>, label: string): Promise<boolean> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await fn();
        return true;
      } catch (err) {
        log("warn", `Email attempt failed`, { service: "book", label, attempt, error: (err as Error).message });
        if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 500));
      }
    }
    log("error", "Email failed after 3 attempts", { service: "book", label });
    return false;
  }

  const [confirmSent] = await Promise.all([
    sendWithRetry(
      () => sendConfirmationEmail({
        to: email, studentName: name, sessionLabel, startIso, endIso,
        meetLink, cancelToken, note: note ?? null, studentTz: timezone ?? null, sessionType,
      }),
      "confirmation email"
    ),
    sendWithRetry(
      () => sendNewBookingNotificationEmail({
        studentEmail: email, studentName: name, sessionLabel,
        startIso, endIso, meetLink, note: note ?? null,
      }),
      "notification email"
    ),
  ]);

  return NextResponse.json({ ok: true, eventId, meetLink, cancelToken, emailFailed: !confirmSent });
}
