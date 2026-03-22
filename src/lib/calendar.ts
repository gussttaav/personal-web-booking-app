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
 *
 * Applied fixes (cumulative):
 *   Week 1 — CRIT-02a: createCancellationToken adds Redis TTL
 *   Week 1 — CRIT-02b: consumeCancellationToken does hard kv.del()
 *   Week 1 — SEC-02:   verifyCancellationToken validates hex format before crypto
 *   Week 2 — ARCH-02:  Uses shared kv singleton from lib/redis.ts
 *   Week 3 — PERF-01:  getAvailableSlots now uses date-fns-tz to build slot
 *                       timestamps correctly for Europe/Madrid across DST
 *                       transitions (CET = UTC+1, CEST = UTC+2).
 *
 * PERF-01 — DST fix detail:
 *   The previous implementation hardcoded +01:00 when constructing slot start
 *   times: new Date(`${dateStr}T${hh}:${mm}:00+01:00`). Spain uses UTC+1 in
 *   winter (CET) and UTC+2 in summer (CEST). On summer days, every slot was
 *   one hour off in UTC terms, making the freebusy comparison unreliable and
 *   potentially showing booked slots as free (or vice versa).
 *
 *   Fix: use toZonedTime / fromZonedTime from date-fns-tz to construct slot
 *   start times in the Europe/Madrid timezone, then convert to UTC for all
 *   comparisons. The freebusy window (timeMin/timeMax) uses the same approach.
 *
 *   Install: npm install date-fns-tz
 */

import { google } from "googleapis";
import { toZonedTime, fromZonedTime, format } from "date-fns-tz";
import { kv } from "@/lib/redis";
import crypto from "crypto";
import { SCHEDULE, DAY_SCHEDULES, dayStartHour } from "@/lib/booking-config";

export { SCHEDULE }; // re-export so existing imports of SCHEDULE from calendar.ts still work

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;
const TZ          = SCHEDULE.timezone; // "Europe/Madrid"

// ─── Google auth ──────────────────────────────────────────────────────────────

function getCalendar() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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
  eventId:     string;
  email:       string;
  name:        string;
  sessionType: string;
  startsAt:    string;
  endsAt:      string;
  used:        boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a UTC Date as "HH:mm" in the Madrid timezone.
 * Uses the IANA timezone so DST is handled automatically.
 */
function formatTime(date: Date): string {
  return format(toZonedTime(date, TZ), "HH:mm", { timeZone: TZ });
}

/**
 * Builds a UTC Date from a local clock time on a given date in Europe/Madrid.
 * fromZonedTime correctly applies the Madrid UTC offset for that exact day,
 * returning UTC+1 in winter and UTC+2 in summer.
 *
 * @param dateStr  "YYYY-MM-DD"
 * @param hours    Local hour (0-23) in Madrid time
 * @param minutes  Local minute (0-59) in Madrid time
 */
function madridToUtc(dateStr: string, hours: number, minutes: number): Date {
  // Construct a local datetime string in Madrid wall-clock time
  const hh  = String(hours).padStart(2, "0");
  const mm  = String(minutes).padStart(2, "0");
  const localDateTimeStr = `${dateStr}T${hh}:${mm}:00`;
  return fromZonedTime(localDateTimeStr, TZ);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns available time slots for a given date and session duration.
 * Queries Google Calendar freebusy, then subtracts busy blocks from
 * the working hours window.
 *
 * PERF-01: All timestamps are now built via madridToUtc() which uses
 * date-fns-tz's fromZonedTime() to resolve the correct UTC offset for the
 * given date. This replaces the hardcoded +01:00 suffix that produced wrong
 * UTC times during CEST (summer, UTC+2).
 */
export async function getAvailableSlots(
  dateStr: string,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const dow      = new Date(`${dateStr}T12:00:00Z`).getDay(); // day-of-week is timezone-independent at noon
  const daySched = DAY_SCHEDULES[dow];
  if (!daySched) return [];

  const startHour = dayStartHour(dow);

  // Build time windows in minutes-from-midnight (local Madrid time)
  const MORNING_END_MINUTES = daySched.morningEnd * 60 - 15; // 13:45 = 825 min
  const windows: { startMin: number; endMin: number }[] = [
    { startMin: startHour * 60, endMin: MORNING_END_MINUTES },
  ];
  if (daySched.afternoonStart !== null && daySched.afternoonEnd !== null) {
    windows.push({
      startMin: daySched.afternoonStart * 60,
      endMin:   daySched.afternoonEnd * 60,
    });
  }

  // PERF-01: Build freebusy window in UTC using madridToUtc, not a hardcoded +01:00
  const timeMin = madridToUtc(dateStr, 0, 0).toISOString();
  const timeMax = madridToUtc(dateStr, 23, 59).toISOString();

  const calendar    = getCalendar();
  const freebusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: TZ,
      items:    [{ id: CALENDAR_ID }],
    },
  });

  const busyBlocks    = freebusyRes.data.calendars?.[CALENDAR_ID]?.busy ?? [];
  const slots: TimeSlot[] = [];
  const now            = new Date();
  const minBookingTime = new Date(now.getTime() + SCHEDULE.minNoticeHours * 60 * 60 * 1000);

  for (const window of windows) {
    let cursorMin = window.startMin;

    while (cursorMin + durationMinutes <= window.endMin) {
      const localHours   = Math.floor(cursorMin / 60);
      const localMinutes = cursorMin % 60;

      // PERF-01: convert local Madrid time → UTC correctly for this date
      const slotStart = madridToUtc(dateStr, localHours, localMinutes);
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
  summary:     string;
  description: string;
  startIso:    string;
  endIso:      string;
}): Promise<{ eventId: string; meetLink: string }> {
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
      start: { dateTime: params.startIso, timeZone: TZ },
      end:   { dateTime: params.endIso,   timeZone: TZ },
      reminders: {
        useDefault: false,
        overrides:  [
          { method: "email", minutes: 60 * 24 },
          { method: "popup", minutes: 30 },
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
    calendarId:  CALENDAR_ID,
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
 * TTL = session end + 1h buffer so keys are automatically evicted (CRIT-02a).
 */
export async function createCancellationToken(
  record: Omit<BookingRecord, "used">
): Promise<string> {
  const payload = `${record.eventId}:${record.email}:${record.startsAt}`;
  const token   = signToken(payload);

  const sessionEndMs = new Date(record.endsAt).getTime();
  const ttlSeconds   = Math.max(3600, Math.floor((sessionEndMs + 3_600_000 - Date.now()) / 1000));

  await kv.set(`cancel:${token}`, { ...record, used: false }, { ex: ttlSeconds });

  return token;
}

/**
 * Verifies a cancellation token and returns the booking record if valid.
 * Returns null if the token is invalid, already expired, or the 2-hour
 * cancellation window has closed.
 *
 * SEC-02: Token format validated before crypto operations.
 */
export async function verifyCancellationToken(
  token: string
): Promise<{ record: BookingRecord; withinWindow: boolean } | null> {
  // Validate format first — must be exactly 64 lowercase hex chars (SHA-256 output)
  if (!/^[0-9a-f]{64}$/.test(token)) return null;

  const record = await kv.get<BookingRecord>(`cancel:${token}`);
  if (!record || record.used) return null;

  const expectedPayload = `${record.eventId}:${record.email}:${record.startsAt}`;
  const expectedToken   = signToken(expectedPayload);

  // Both buffers guaranteed 32 bytes (64 hex chars validated above)
  const valid = crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(expectedToken, "hex")
  );
  if (!valid) return null;

  const startsAt       = new Date(record.startsAt);
  const twoHoursBefore = new Date(startsAt.getTime() - 2 * 60 * 60_000);
  const withinWindow   = new Date() < twoHoursBefore;

  return { record, withinWindow };
}

/**
 * Deletes the cancellation token from KV so it cannot be reused (CRIT-02b).
 */
export async function consumeCancellationToken(token: string): Promise<void> {
  await kv.del(`cancel:${token}`);
}
