/**
 * lib/calendar.ts
 *
 * Google Calendar API integration.
 *
 * Responsibilities:
 *   - Query freebusy to find available slots
 *   - Create calendar events with Google Meet links
 *   - Delete events on cancellation
 *   - Generate and verify signed cancellation tokens (stored in KV)
 *
 * Prerequisites (env vars):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_CALENDAR_ID   ← your personal calendar ID (usually your Gmail address)
 *   CANCEL_SECRET        ← openssl rand -hex 32
 */

import { google } from "googleapis";
import { Redis } from "@upstash/redis";
import crypto from "crypto";
import { SCHEDULE, DAY_SCHEDULES, dayStartHour } from "@/lib/booking-config";

export { SCHEDULE }; // re-export so existing imports of SCHEDULE from calendar.ts still work

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;
const kv = Redis.fromEnv();

// ─── Google auth ──────────────────────────────────────────────────────────────

function getCalendar() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeSlot {
  /** ISO 8601 start datetime */
  start: string;
  /** ISO 8601 end datetime */
  end: string;
  /** Human-readable label e.g. "10:00" */
  label: string;
}

export interface BookingRecord {
  eventId: string;
  email: string;
  name: string;
  sessionType: string;
  startsAt: string;
  endsAt: string;
  used: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    timeZone: SCHEDULE.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns available time slots for a given date and session duration.
 * Queries Google Calendar freebusy, then subtracts busy blocks from
 * the working hours window.
 */
export async function getAvailableSlots(
  dateStr: string,
  durationMinutes: number
): Promise<TimeSlot[]> {
  // Determine Madrid day-of-week for this date
  const dow = new Date(`${dateStr}T12:00:00`).getDay(); // 0=Sun…6=Sat
  const daySched = DAY_SCHEDULES[dow];
  if (!daySched) return [];

  const startHour = dayStartHour(dow);

  // Build the valid time windows for this day
  // Morning: startHour → daySched.morningEnd (exclusive)
  // Afternoon: daySched.afternoonStart → daySched.afternoonEnd (if present)
  // The 13:45 cutoff is handled by the slot end not exceeding morningEnd*60 minutes
  const MORNING_END_MINUTES  = daySched.morningEnd * 60 - 15; // 13:45 = 825 min from midnight
  const windows: { startMin: number; endMin: number }[] = [
    { startMin: startHour * 60, endMin: MORNING_END_MINUTES },
  ];
  if (daySched.afternoonStart !== null && daySched.afternoonEnd !== null) {
    windows.push({
      startMin: daySched.afternoonStart * 60,
      endMin:   daySched.afternoonEnd * 60,
    });
  }

  // Freebusy query for the full day
  const timeMin = new Date(`${dateStr}T00:00:00+01:00`).toISOString();
  const timeMax = new Date(`${dateStr}T23:59:59+01:00`).toISOString();

  const calendar = getCalendar();
  const freebusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: SCHEDULE.timezone,
      items: [{ id: CALENDAR_ID }],
    },
  });

  const busyBlocks = freebusyRes.data.calendars?.[CALENDAR_ID]?.busy ?? [];

  const slots: TimeSlot[] = [];
  const now = new Date();
  const minBookingTime = new Date(now.getTime() + SCHEDULE.minNoticeHours * 60 * 60 * 1000);

  // Iterate over each time window and generate slots
  for (const window of windows) {
    // Start cursor at window start (in UTC, using Madrid offset)
    let cursorMin = window.startMin;

    while (cursorMin + durationMinutes <= window.endMin) {
      const slotStart = new Date(`${dateStr}T${String(Math.floor(cursorMin / 60)).padStart(2, "0")}:${String(cursorMin % 60).padStart(2, "0")}:00+01:00`);
      const slotEnd   = new Date(slotStart.getTime() + durationMinutes * 60_000);

      const overlapsBusy = busyBlocks.some((block) => {
        const bStart = new Date(block.start!);
        const bEnd   = new Date(block.end!);
        return slotStart < bEnd && slotEnd > bStart;
      });

      const tooSoon = slotStart < minBookingTime;

      if (!overlapsBusy && !tooSoon) {
        slots.push({
          start: slotStart.toISOString(),
          end:   slotEnd.toISOString(),
          label: formatTime(slotStart),
        });
      }

      cursorMin += durationMinutes;
    }
  }

  return slots;
}


export async function createCalendarEvent(params: {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
}): Promise<{ eventId: string; meetLink: string }> {
  // Use the static permanent Meet room configured in GOOGLE_MEET_URL env var.
  // Service accounts cannot generate Meet links on personal Gmail calendars
  // regardless of the API used — a fixed room is the correct approach for a
  // solo tutor (one stable link, always available, you control access).
  const meetLink = process.env.GOOGLE_MEET_URL ?? "";

  const calendar = getCalendar();

  const event = await calendar.events.insert({
    calendarId:  CALENDAR_ID,
    sendUpdates: "none",
    requestBody: {
      summary:     params.summary,
      description: meetLink
        ? `${params.description}\n\nGoogle Meet: ${meetLink}`
        : params.description,
      location: meetLink || undefined,
      start: { dateTime: params.startIso, timeZone: SCHEDULE.timezone },
      end:   { dateTime: params.endIso,   timeZone: SCHEDULE.timezone },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email",  minutes: 60 * 24 },
          { method: "popup",  minutes: 30 },
        ],
      },
    },
  });

  return { eventId: event.data.id!, meetLink };
}


/**
 * Deletes a Google Calendar event by ID.
 * Used when a student cancels a booking.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendar();
  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId,
    sendUpdates: "none",
  });
}

// ─── Cancellation tokens ──────────────────────────────────────────────────────

const CANCEL_SECRET = process.env.CANCEL_SECRET!;

function signToken(payload: string): string {
  return crypto
    .createHmac("sha256", CANCEL_SECRET)
    .update(payload)
    .digest("hex");
}

/**
 * Generates a signed cancellation token and stores the booking record in KV.
 * Returns the token to be embedded in the cancellation email link.
 */
export async function createCancellationToken(record: Omit<BookingRecord, "used">): Promise<string> {
  const payload = `${record.eventId}:${record.email}:${record.startsAt}`;
  const token   = signToken(payload);

  await kv.set(`cancel:${token}`, { ...record, used: false });

  return token;
}

/**
 * Verifies a cancellation token and returns the booking record if valid.
 * Returns null if the token is invalid, already used, or the 2-hour window has passed.
 */
export async function verifyCancellationToken(
  token: string
): Promise<{ record: BookingRecord; withinWindow: boolean } | null> {
  const record = await kv.get<BookingRecord>(`cancel:${token}`);
  if (!record) return null;
  if (record.used) return null;

  // Verify the HMAC signature
  const expectedPayload = `${record.eventId}:${record.email}:${record.startsAt}`;
  const expectedToken   = signToken(expectedPayload);
  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(expectedToken, "hex")
    );
    if (!valid) return null;
  } catch {
    return null;
  }

  const startsAt      = new Date(record.startsAt);
  const twoHoursBefore = new Date(startsAt.getTime() - 2 * 60 * 60_000);
  const withinWindow   = new Date() < twoHoursBefore;

  return { record, withinWindow };
}

/**
 * Marks a cancellation token as used so it cannot be reused.
 */
export async function consumeCancellationToken(token: string): Promise<void> {
  const record = await kv.get<BookingRecord>(`cancel:${token}`);
  if (record) {
    await kv.set(`cancel:${token}`, { ...record, used: true });
  }
}
