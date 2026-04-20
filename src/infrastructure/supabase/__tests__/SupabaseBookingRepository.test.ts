// DB-02: Integration tests for SupabaseBookingRepository.
// Gated on SUPABASE_URL — skips in CI without a database configured.
import { SupabaseBookingRepository } from "../SupabaseBookingRepository";
import { supabase } from "../client";

const describeDb = process.env.SUPABASE_URL ? describe : describe.skip;

const baseRecord = () => ({
  eventId:     `evt-${Date.now()}`,
  email:       `test-booking-${Date.now()}@example.com`,
  name:        "Test Student",
  sessionType: "session1h" as const,
  startsAt:    new Date(Date.now() + 86_400_000).toISOString(),
  endsAt:      new Date(Date.now() + 86_400_000 + 3_600_000).toISOString(),
});

describeDb("SupabaseBookingRepository", () => {
  const repo = new SupabaseBookingRepository();

  async function cleanup(email: string) {
    const { data: user } = await supabase
      .from("users").select("id").eq("email", email).maybeSingle();
    if (user) {
      await supabase.from("bookings").delete().eq("user_id", user.id);
      await supabase.from("users").delete().eq("id", user.id);
    }
  }

  it("createBooking returns cancelToken and joinToken", async () => {
    const record = baseRecord();
    const { cancelToken, joinToken } = await repo.createBooking(record);

    expect(cancelToken).toMatch(/^[0-9a-f]{64}$/);
    expect(joinToken).toMatch(/^[0-9a-f]{64}$/);
    expect(cancelToken).not.toBe(joinToken);

    await cleanup(record.email);
  });

  it("findByCancelToken returns record for valid token", async () => {
    const record = baseRecord();
    const { cancelToken } = await repo.createBooking(record);

    const found = await repo.findByCancelToken(cancelToken);
    expect(found).not.toBeNull();
    expect(found!.eventId).toBe(record.eventId);
    expect(found!.email).toBe(record.email);
    expect(found!.used).toBe(false);

    await cleanup(record.email);
  });

  it("findByCancelToken returns null for malformed token", async () => {
    const result = await repo.findByCancelToken("not-a-valid-hex-token");
    expect(result).toBeNull();
  });

  it("findByJoinToken returns eventId and email", async () => {
    const record = baseRecord();
    const { joinToken } = await repo.createBooking(record);

    const found = await repo.findByJoinToken(joinToken);
    expect(found).not.toBeNull();
    expect(found!.eventId).toBe(record.eventId);
    expect(found!.email).toBe(record.email);

    await cleanup(record.email);
  });

  it("consumeCancelToken returns true first time, false on double-consume", async () => {
    const record = baseRecord();
    const { cancelToken } = await repo.createBooking(record);

    const first  = await repo.consumeCancelToken(cancelToken);
    const second = await repo.consumeCancelToken(cancelToken);

    expect(first).toBe(true);
    expect(second).toBe(false);

    await cleanup(record.email);
  });

  it("listByUser excludes cancelled bookings", async () => {
    const record = baseRecord();
    const { cancelToken } = await repo.createBooking(record);

    let list = await repo.listByUser(record.email);
    expect(list.length).toBe(1);

    await repo.consumeCancelToken(cancelToken);

    list = await repo.listByUser(record.email);
    expect(list.length).toBe(0);

    await cleanup(record.email);
  });

  it("acquireSlotLock returns true then false for same slot", async () => {
    const startIso = new Date(Date.now() + 999_999_000).toISOString();
    const first  = await repo.acquireSlotLock(startIso, 60);
    const second = await repo.acquireSlotLock(startIso, 60);

    expect(first).toBe(true);
    expect(second).toBe(false);

    await repo.releaseSlotLock(startIso);
    // After release, a new acquire should succeed
    const third = await repo.acquireSlotLock(startIso, 60);
    expect(third).toBe(true);
    await repo.releaseSlotLock(startIso);
  });
});
