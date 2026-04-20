// DB-02: Integration tests for SupabasePaymentRepository.
// Gated on SUPABASE_URL — skips in CI without a database configured.
import { SupabasePaymentRepository } from "../SupabasePaymentRepository";
import { supabase } from "../client";

const describeDb = process.env.SUPABASE_URL ? describe : describe.skip;

describeDb("SupabasePaymentRepository", () => {
  const repo = new SupabasePaymentRepository();
  const idempotencyKey    = `webhook_${Date.now()}`;
  const stripeSessionId   = `cs_test_${Date.now()}`;

  afterAll(async () => {
    await supabase.from("webhook_events").delete().eq("idempotency_key", idempotencyKey);
    await supabase.from("failed_bookings").delete().eq("stripe_session_id", stripeSessionId);
  });

  it("isProcessed returns false before markProcessed", async () => {
    const result = await repo.isProcessed(idempotencyKey);
    expect(result).toBe(false);
  });

  it("markProcessed + isProcessed returns true", async () => {
    await repo.markProcessed(idempotencyKey);
    const result = await repo.isProcessed(idempotencyKey);
    expect(result).toBe(true);
  });

  it("markProcessed is idempotent (no error on duplicate)", async () => {
    await expect(repo.markProcessed(idempotencyKey)).resolves.not.toThrow();
  });

  it("recordFailedBooking + listFailedBookings + clearFailedBooking flow", async () => {
    const entry = {
      stripeSessionId,
      email:    "failed@example.com",
      startIso: new Date(Date.now() + 86_400_000).toISOString(),
      failedAt: new Date().toISOString(),
      error:    "Calendar API 503",
    };

    await repo.recordFailedBooking(entry);

    const list = await repo.listFailedBookings();
    const found = list.find(e => e.stripeSessionId === stripeSessionId);
    expect(found).toBeDefined();
    expect(found!.email).toBe("failed@example.com");
    expect(found!.error).toBe("Calendar API 503");

    await repo.clearFailedBooking(stripeSessionId);

    const after = await repo.listFailedBookings();
    expect(after.find(e => e.stripeSessionId === stripeSessionId)).toBeUndefined();
  });

  it("clearFailedBooking is idempotent (no error if not found)", async () => {
    await expect(repo.clearFailedBooking("cs_nonexistent")).resolves.not.toThrow();
  });
});
