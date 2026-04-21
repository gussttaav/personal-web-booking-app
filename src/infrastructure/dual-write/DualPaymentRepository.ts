// DB-03: Dual-write wrapper for payment/idempotency operations.
// Writes fan out to primary (Redis) and shadow (Supabase). Reads come from
// primary only. Shadow failures are logged but never thrown.
// Temporary: deleted after Task 4.5 flips primary to Supabase.
import type { IPaymentRepository, FailedBookingEntry } from "@/domain/repositories/IPaymentRepository";
import { log } from "@/lib/logger";

export class DualPaymentRepository implements IPaymentRepository {
  constructor(
    private readonly primary: IPaymentRepository,
    private readonly shadow:  IPaymentRepository,
  ) {}

  async isProcessed(idempotencyKey: string): Promise<boolean> {
    return this.primary.isProcessed(idempotencyKey);
  }

  async markProcessed(idempotencyKey: string): Promise<void> {
    await this.primary.markProcessed(idempotencyKey);
    this.shadow.markProcessed(idempotencyKey).catch((err) =>
      log("warn", "Shadow write failed: markProcessed", {
        service: "dual-write",
        idempotencyKey,
        error: String(err),
      })
    );
  }

  async recordFailedBooking(entry: FailedBookingEntry): Promise<void> {
    await this.primary.recordFailedBooking(entry);
    this.shadow.recordFailedBooking(entry).catch((err) =>
      log("warn", "Shadow write failed: recordFailedBooking", {
        service: "dual-write",
        stripeSessionId: entry.stripeSessionId,
        error: String(err),
      })
    );
  }

  async listFailedBookings(): Promise<FailedBookingEntry[]> {
    return this.primary.listFailedBookings();
  }

  async clearFailedBooking(stripeSessionId: string): Promise<void> {
    await this.primary.clearFailedBooking(stripeSessionId);
    this.shadow.clearFailedBooking(stripeSessionId).catch((err) =>
      log("warn", "Shadow write failed: clearFailedBooking", {
        service: "dual-write",
        stripeSessionId,
        error: String(err),
      })
    );
  }
}
