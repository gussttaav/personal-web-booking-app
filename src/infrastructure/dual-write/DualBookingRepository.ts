// DB-03: Dual-write wrapper for booking operations.
// Writes fan out to primary (Redis) and shadow (Supabase). Reads come from
// primary only. For atomic boolean ops (consumeCancelToken, acquireSlotLock),
// shadow is written only when primary succeeded to prevent drift.
// Temporary: deleted after Task 4.5 flips primary to Supabase.
import type { IBookingRepository, } from "@/domain/repositories/IBookingRepository";
import type { BookingRecord, SessionType } from "@/domain/types";
import { log } from "@/lib/logger";

export class DualBookingRepository implements IBookingRepository {
  constructor(
    private readonly primary: IBookingRepository,
    private readonly shadow:  IBookingRepository,
  ) {}

  async createBooking(record: Omit<BookingRecord, "used">): Promise<{ cancelToken: string; joinToken: string }> {
    const result = await this.primary.createBooking(record);
    this.shadow.createBooking(record).catch((err) =>
      log("warn", "Shadow write failed: createBooking", {
        service: "dual-write",
        email: record.email,
        error: String(err),
      })
    );
    return result;
  }

  async findByCancelToken(token: string): Promise<BookingRecord | null> {
    return this.primary.findByCancelToken(token);
  }

  async findByJoinToken(token: string): Promise<{ eventId: string; email: string } | null> {
    return this.primary.findByJoinToken(token);
  }

  async consumeCancelToken(token: string): Promise<boolean> {
    const consumed = await this.primary.consumeCancelToken(token);
    if (consumed) {
      this.shadow.consumeCancelToken(token).catch((err) =>
        log("warn", "Shadow write failed: consumeCancelToken", { service: "dual-write", error: String(err) })
      );
    }
    return consumed;
  }

  async listByUser(email: string): Promise<{ cancelToken: string; record: BookingRecord }[]> {
    return this.primary.listByUser(email);
  }

  async recordRescheduleFailure(data: {
    email:       string;
    startIso:    string;
    endIso:      string;
    sessionType: SessionType;
    error:       string;
  }): Promise<void> {
    await this.primary.recordRescheduleFailure(data);
    this.shadow.recordRescheduleFailure(data).catch((err) =>
      log("warn", "Shadow write failed: recordRescheduleFailure", {
        service: "dual-write",
        email: data.email,
        error: String(err),
      })
    );
  }

  async acquireSlotLock(startIso: string, durationMinutes: number): Promise<boolean> {
    const acquired = await this.primary.acquireSlotLock(startIso, durationMinutes);
    if (acquired) {
      this.shadow.acquireSlotLock(startIso, durationMinutes).catch((err) =>
        log("warn", "Shadow write failed: acquireSlotLock", {
          service: "dual-write",
          startIso,
          error: String(err),
        })
      );
    }
    return acquired;
  }

  async releaseSlotLock(startIso: string): Promise<void> {
    await this.primary.releaseSlotLock(startIso);
    this.shadow.releaseSlotLock(startIso).catch((err) =>
      log("warn", "Shadow write failed: releaseSlotLock", {
        service: "dual-write",
        startIso,
        error: String(err),
      })
    );
  }
}
