// ARCH-11 — Redis-backed implementation of IBookingRepository.
// Delegates to src/lib/calendar.ts for token operations and uses kv directly
// for listByUser (no equivalent helper exists in calendar.ts).
import type { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import type { BookingRecord } from "@/domain/types";
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

  async listByUser(email: string): Promise<BookingRecord[]> {
    const setKey = `bookings:${email.toLowerCase().trim()}`;
    const tokens = await kv.zrange<string[]>(setKey, 0, -1);
    if (!tokens?.length) return [];

    const records = await Promise.all(
      tokens.map(t => kv.get<BookingRecord>(`cancel:${t}`))
    );
    return records.filter((r): r is BookingRecord => r !== null && !r.used);
  }

  async acquireSlotLock(startIso: string, durationMinutes: number): Promise<boolean> {
    return calendarModule.acquireSlotLock(startIso, durationMinutes);
  }

  async releaseSlotLock(startIso: string): Promise<void> {
    return calendarModule.releaseSlotLock(startIso);
  }
}
