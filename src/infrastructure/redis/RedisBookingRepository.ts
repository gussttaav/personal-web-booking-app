// ARCH-11 — Redis-backed implementation of IBookingRepository.
// Delegates to src/lib/calendar.ts for token operations and uses kv directly
// for listByUser (no equivalent helper exists in calendar.ts).
// ARCH-13: listByUser returns { cancelToken, record }[]; recordRescheduleFailure added.
import type { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import type { BookingRecord, SessionType } from "@/domain/types";
import * as calendarModule from "@/lib/calendar";
import { kv } from "@/lib/redis";

export class RedisBookingRepository implements IBookingRepository {
  async createBooking(record: Omit<BookingRecord, "used">): Promise<{
    cancelToken: string;
    joinToken:   string;
  }> {
    return calendarModule.createBookingTokens(record);
  }

  async findByCancelToken(token: string): Promise<BookingRecord | null> {
    const result = await calendarModule.verifyCancellationToken(token);
    return (result?.record ?? null) as BookingRecord | null;
  }

  async findByJoinToken(token: string): Promise<{ eventId: string; email: string } | null> {
    return calendarModule.resolveJoinToken(token) as Promise<{ eventId: string; email: string } | null>;
  }

  async consumeCancelToken(token: string): Promise<boolean> {
    const rec = await calendarModule.verifyCancellationToken(token);
    return calendarModule.consumeCancellationToken(token, rec?.record.email);
  }

  async listByUser(email: string): Promise<{ cancelToken: string; record: BookingRecord }[]> {
    const setKey = `bookings:${email.toLowerCase().trim()}`;
    const tokens = await kv.zrange<string[]>(setKey, 0, -1);
    if (!tokens?.length) return [];

    const records = await Promise.all(
      tokens.map(async (t) => {
        const rec = await kv.get<BookingRecord>(`cancel:${t}`);
        return rec && !rec.used ? { cancelToken: t, record: rec } : null;
      })
    );

    const active = records.filter((r): r is { cancelToken: string; record: BookingRecord } => r !== null);

    // Best-effort: remove stale members from the sorted set
    const staleTokens = records
      .map((r, i) => (r === null ? tokens[i] : null))
      .filter((t): t is string => t !== null);
    if (staleTokens.length > 0) {
      kv.zrem(setKey, ...staleTokens).catch(() => {});
    }

    return active;
  }

  async recordRescheduleFailure(data: {
    email:       string;
    startIso:    string;
    endIso:      string;
    sessionType: SessionType;
    error:       string;
  }): Promise<void> {
    await kv.set(
      `failed:reschedule:${data.email}:${Date.now()}`,
      data,
      { ex: 30 * 24 * 60 * 60 },
    );
  }

  async acquireSlotLock(startIso: string, durationMinutes: number): Promise<boolean> {
    return calendarModule.acquireSlotLock(startIso, durationMinutes);
  }

  async releaseSlotLock(startIso: string): Promise<void> {
    return calendarModule.releaseSlotLock(startIso);
  }
}
