/**
 * Unit tests for calendar DST helpers.
 *
 * Slot-lock tests were removed when the Redis slot-lock.ts was deleted;
 * locking is now handled exclusively by the Postgres acquire_slot_lock
 * stored procedure via IBookingRepository.
 */

describe("DST offset correctness (madridToUtc)", () => {
  it("winter date uses UTC+1: 10:00 Madrid = 09:00 UTC", () => {
    const { fromZonedTime } = require("date-fns-tz");
    const winterLocal = "2025-01-15T10:00:00";
    const utc = fromZonedTime(winterLocal, "Europe/Madrid");
    expect(utc.getUTCHours()).toBe(9);
    expect(utc.getUTCMinutes()).toBe(0);
  });

  it("summer date uses UTC+2: 10:00 Madrid = 08:00 UTC", () => {
    const { fromZonedTime } = require("date-fns-tz");
    const summerLocal = "2025-07-15T10:00:00";
    const utc = fromZonedTime(summerLocal, "Europe/Madrid");
    expect(utc.getUTCHours()).toBe(8);
    expect(utc.getUTCMinutes()).toBe(0);
  });

  it("same wall-clock time on the same date in CET vs CEST is 1 UTC hour apart", () => {
    const { fromZonedTime } = require("date-fns-tz");
    const beforeDST = fromZonedTime("2025-03-28T10:00:00", "Europe/Madrid");
    const afterDST  = fromZonedTime("2025-03-30T10:00:00", "Europe/Madrid");
    expect(beforeDST.getUTCHours()).toBe(9);
    expect(afterDST.getUTCHours()).toBe(8);
    expect(beforeDST.getUTCHours() - afterDST.getUTCHours()).toBe(1);
  });
});
