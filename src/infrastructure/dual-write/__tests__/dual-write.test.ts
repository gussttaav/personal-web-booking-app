// DB-03 — Unit tests for dual-write wrappers.
// Verifies: shadow failures don't propagate, primary failures do, reads are
// primary-only, atomic ops shadow-write only on primary success.

import { DualCreditsRepository }  from "../DualCreditsRepository";
import { DualBookingRepository }  from "../DualBookingRepository";
import { DualSessionRepository }  from "../DualSessionRepository";
import { DualPaymentRepository }  from "../DualPaymentRepository";
import { DualAuditRepository }    from "../DualAuditRepository";
import type { ICreditsRepository } from "@/domain/repositories/ICreditsRepository";
import type { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import type { ISessionRepository } from "@/domain/repositories/ISessionRepository";
import type { IPaymentRepository, FailedBookingEntry } from "@/domain/repositories/IPaymentRepository";
import type { IAuditRepository }  from "@/domain/repositories/IAuditRepository";

// ─── helpers ──────────────────────────────────────────────────────────────────

function mockCreditsRepo(): jest.Mocked<ICreditsRepository> {
  return {
    getCredits:      jest.fn(),
    addCredits:      jest.fn(),
    decrementCredit: jest.fn(),
    restoreCredit:   jest.fn(),
  };
}

function mockBookingRepo(): jest.Mocked<IBookingRepository> {
  return {
    createBooking:           jest.fn(),
    findByCancelToken:       jest.fn(),
    findByJoinToken:         jest.fn(),
    consumeCancelToken:      jest.fn(),
    listByUser:              jest.fn(),
    recordRescheduleFailure: jest.fn(),
    acquireSlotLock:         jest.fn(),
    releaseSlotLock:         jest.fn(),
  };
}

function mockSessionRepo(): jest.Mocked<ISessionRepository> {
  return {
    createSession:     jest.fn(),
    findByEventId:     jest.fn(),
    deleteByEventId:   jest.fn(),
    appendChatMessage: jest.fn(),
    listChatMessages:  jest.fn(),
    countChatMessages: jest.fn(),
  };
}

function mockPaymentRepo(): jest.Mocked<IPaymentRepository> {
  return {
    isProcessed:          jest.fn(),
    markProcessed:        jest.fn(),
    recordFailedBooking:  jest.fn(),
    listFailedBookings:   jest.fn(),
    clearFailedBooking:   jest.fn(),
  };
}

function mockAuditRepo(): jest.Mocked<IAuditRepository> {
  return {
    append: jest.fn(),
    list:   jest.fn(),
  };
}

const sampleCreditsParams = {
  email: "test@example.com",
  name: "Test User",
  creditsToAdd: 5,
  packLabel: "Pack 5",
  stripeSessionId: "cs_test_abc",
};

const sampleBookingRecord = {
  eventId: "evt_1",
  email: "test@example.com",
  name: "Test User",
  sessionType: "session1h" as const,
  startsAt: "2026-05-01T10:00:00Z",
  endsAt: "2026-05-01T11:00:00Z",
};

const sampleZoomSession = {
  sessionId: "sess_1",
  sessionName: "session",
  sessionPasscode: "pass",
  studentEmail: "test@example.com",
  startIso: "2026-05-01T10:00:00Z",
  durationMinutes: 60,
  sessionType: "session1h" as const,
};

const sampleFailedBooking: FailedBookingEntry = {
  stripeSessionId: "cs_test_abc",
  email: "test@example.com",
  startIso: "2026-05-01T10:00:00Z",
  failedAt: "2026-05-01T10:05:00Z",
  error: "Calendar error",
};

// ─── DualCreditsRepository ────────────────────────────────────────────────────

describe("DualCreditsRepository", () => {
  it("getCredits returns primary result, shadow never called", async () => {
    const primary = mockCreditsRepo();
    const shadow  = mockCreditsRepo();
    primary.getCredits.mockResolvedValue(null);

    const repo = new DualCreditsRepository(primary, shadow);
    await expect(repo.getCredits("test@example.com")).resolves.toBeNull();

    expect(primary.getCredits).toHaveBeenCalledWith("test@example.com");
    expect(shadow.getCredits).not.toHaveBeenCalled();
  });

  it("addCredits does not throw when shadow fails", async () => {
    const primary = mockCreditsRepo();
    const shadow  = mockCreditsRepo();
    primary.addCredits.mockResolvedValue(undefined);
    shadow.addCredits.mockRejectedValue(new Error("shadow down"));

    const repo = new DualCreditsRepository(primary, shadow);
    await expect(repo.addCredits(sampleCreditsParams)).resolves.toBeUndefined();
    expect(primary.addCredits).toHaveBeenCalled();
  });

  it("addCredits propagates primary failure, shadow not called", async () => {
    const primary = mockCreditsRepo();
    const shadow  = mockCreditsRepo();
    primary.addCredits.mockRejectedValue(new Error("primary down"));

    const repo = new DualCreditsRepository(primary, shadow);
    await expect(repo.addCredits(sampleCreditsParams)).rejects.toThrow("primary down");
    expect(shadow.addCredits).not.toHaveBeenCalled();
  });

  it("decrementCredit writes to shadow only when primary ok=true", async () => {
    const primary = mockCreditsRepo();
    const shadow  = mockCreditsRepo();
    primary.decrementCredit.mockResolvedValue({ ok: true, remaining: 4 });
    shadow.decrementCredit.mockResolvedValue({ ok: true, remaining: 4 });

    const repo = new DualCreditsRepository(primary, shadow);
    const result = await repo.decrementCredit("test@example.com");

    expect(result).toEqual({ ok: true, remaining: 4 });
    // allow shadow fire-and-forget to settle
    await new Promise(resolve => setImmediate(resolve));
    expect(shadow.decrementCredit).toHaveBeenCalledWith("test@example.com");
  });

  it("decrementCredit does not write to shadow when primary ok=false", async () => {
    const primary = mockCreditsRepo();
    const shadow  = mockCreditsRepo();
    primary.decrementCredit.mockResolvedValue({ ok: false, remaining: 0 });

    const repo = new DualCreditsRepository(primary, shadow);
    await repo.decrementCredit("test@example.com");

    expect(shadow.decrementCredit).not.toHaveBeenCalled();
  });

  it("restoreCredit writes to shadow only when primary ok=true", async () => {
    const primary = mockCreditsRepo();
    const shadow  = mockCreditsRepo();
    primary.restoreCredit.mockResolvedValue({ ok: true, credits: 5 });
    shadow.restoreCredit.mockResolvedValue({ ok: true, credits: 5 });

    const repo = new DualCreditsRepository(primary, shadow);
    await repo.restoreCredit("test@example.com");

    await new Promise(resolve => setImmediate(resolve));
    expect(shadow.restoreCredit).toHaveBeenCalledWith("test@example.com");
  });

  it("restoreCredit does not write to shadow when primary ok=false", async () => {
    const primary = mockCreditsRepo();
    const shadow  = mockCreditsRepo();
    primary.restoreCredit.mockResolvedValue({ ok: false, credits: 0 });

    const repo = new DualCreditsRepository(primary, shadow);
    await repo.restoreCredit("test@example.com");

    expect(shadow.restoreCredit).not.toHaveBeenCalled();
  });
});

// ─── DualBookingRepository ────────────────────────────────────────────────────

describe("DualBookingRepository", () => {
  it("createBooking does not throw when shadow fails", async () => {
    const primary = mockBookingRepo();
    const shadow  = mockBookingRepo();
    primary.createBooking.mockResolvedValue({ cancelToken: "c1", joinToken: "j1" });
    shadow.createBooking.mockRejectedValue(new Error("shadow down"));

    const repo = new DualBookingRepository(primary, shadow);
    await expect(repo.createBooking(sampleBookingRecord)).resolves.toEqual({ cancelToken: "c1", joinToken: "j1" });
  });

  it("createBooking propagates primary failure", async () => {
    const primary = mockBookingRepo();
    const shadow  = mockBookingRepo();
    primary.createBooking.mockRejectedValue(new Error("primary down"));

    const repo = new DualBookingRepository(primary, shadow);
    await expect(repo.createBooking(sampleBookingRecord)).rejects.toThrow("primary down");
    expect(shadow.createBooking).not.toHaveBeenCalled();
  });

  it("findByCancelToken delegates to primary only", async () => {
    const primary = mockBookingRepo();
    const shadow  = mockBookingRepo();
    primary.findByCancelToken.mockResolvedValue(null);

    const repo = new DualBookingRepository(primary, shadow);
    await repo.findByCancelToken("tok");
    expect(primary.findByCancelToken).toHaveBeenCalledWith("tok");
    expect(shadow.findByCancelToken).not.toHaveBeenCalled();
  });

  it("consumeCancelToken shadows only when primary returns true", async () => {
    const primary = mockBookingRepo();
    const shadow  = mockBookingRepo();
    primary.consumeCancelToken.mockResolvedValue(true);
    shadow.consumeCancelToken.mockResolvedValue(true);

    const repo = new DualBookingRepository(primary, shadow);
    const result = await repo.consumeCancelToken("tok");

    expect(result).toBe(true);
    await new Promise(resolve => setImmediate(resolve));
    expect(shadow.consumeCancelToken).toHaveBeenCalledWith("tok");
  });

  it("consumeCancelToken skips shadow when primary returns false", async () => {
    const primary = mockBookingRepo();
    const shadow  = mockBookingRepo();
    primary.consumeCancelToken.mockResolvedValue(false);

    const repo = new DualBookingRepository(primary, shadow);
    await repo.consumeCancelToken("tok");
    expect(shadow.consumeCancelToken).not.toHaveBeenCalled();
  });

  it("acquireSlotLock shadows only when primary returns true", async () => {
    const primary = mockBookingRepo();
    const shadow  = mockBookingRepo();
    primary.acquireSlotLock.mockResolvedValue(true);
    shadow.acquireSlotLock.mockResolvedValue(true);

    const repo = new DualBookingRepository(primary, shadow);
    await repo.acquireSlotLock("2026-05-01T10:00:00Z", 60);

    await new Promise(resolve => setImmediate(resolve));
    expect(shadow.acquireSlotLock).toHaveBeenCalled();
  });

  it("acquireSlotLock skips shadow when primary returns false", async () => {
    const primary = mockBookingRepo();
    const shadow  = mockBookingRepo();
    primary.acquireSlotLock.mockResolvedValue(false);

    const repo = new DualBookingRepository(primary, shadow);
    await repo.acquireSlotLock("2026-05-01T10:00:00Z", 60);
    expect(shadow.acquireSlotLock).not.toHaveBeenCalled();
  });
});

// ─── DualSessionRepository ────────────────────────────────────────────────────

describe("DualSessionRepository", () => {
  it("createSession does not throw when shadow fails", async () => {
    const primary = mockSessionRepo();
    const shadow  = mockSessionRepo();
    primary.createSession.mockResolvedValue(undefined);
    shadow.createSession.mockRejectedValue(new Error("shadow down"));

    const repo = new DualSessionRepository(primary, shadow);
    await expect(repo.createSession("evt_1", sampleZoomSession)).resolves.toBeUndefined();
  });

  it("createSession propagates primary failure", async () => {
    const primary = mockSessionRepo();
    const shadow  = mockSessionRepo();
    primary.createSession.mockRejectedValue(new Error("primary down"));

    const repo = new DualSessionRepository(primary, shadow);
    await expect(repo.createSession("evt_1", sampleZoomSession)).rejects.toThrow("primary down");
    expect(shadow.createSession).not.toHaveBeenCalled();
  });

  it("findByEventId delegates to primary only", async () => {
    const primary = mockSessionRepo();
    const shadow  = mockSessionRepo();
    primary.findByEventId.mockResolvedValue(null);

    const repo = new DualSessionRepository(primary, shadow);
    await repo.findByEventId("evt_1");
    expect(primary.findByEventId).toHaveBeenCalledWith("evt_1");
    expect(shadow.findByEventId).not.toHaveBeenCalled();
  });

  it("appendChatMessage does not throw when shadow fails", async () => {
    const primary = mockSessionRepo();
    const shadow  = mockSessionRepo();
    primary.appendChatMessage.mockResolvedValue(1);
    shadow.appendChatMessage.mockRejectedValue(new Error("shadow down"));

    const repo = new DualSessionRepository(primary, shadow);
    await expect(repo.appendChatMessage("evt_1", "hello")).resolves.toBe(1);
  });
});

// ─── DualPaymentRepository ────────────────────────────────────────────────────

describe("DualPaymentRepository", () => {
  it("isProcessed delegates to primary only", async () => {
    const primary = mockPaymentRepo();
    const shadow  = mockPaymentRepo();
    primary.isProcessed.mockResolvedValue(false);

    const repo = new DualPaymentRepository(primary, shadow);
    await repo.isProcessed("key");
    expect(primary.isProcessed).toHaveBeenCalledWith("key");
    expect(shadow.isProcessed).not.toHaveBeenCalled();
  });

  it("markProcessed does not throw when shadow fails", async () => {
    const primary = mockPaymentRepo();
    const shadow  = mockPaymentRepo();
    primary.markProcessed.mockResolvedValue(undefined);
    shadow.markProcessed.mockRejectedValue(new Error("shadow down"));

    const repo = new DualPaymentRepository(primary, shadow);
    await expect(repo.markProcessed("key")).resolves.toBeUndefined();
  });

  it("markProcessed propagates primary failure", async () => {
    const primary = mockPaymentRepo();
    const shadow  = mockPaymentRepo();
    primary.markProcessed.mockRejectedValue(new Error("primary down"));

    const repo = new DualPaymentRepository(primary, shadow);
    await expect(repo.markProcessed("key")).rejects.toThrow("primary down");
    expect(shadow.markProcessed).not.toHaveBeenCalled();
  });

  it("recordFailedBooking does not throw when shadow fails", async () => {
    const primary = mockPaymentRepo();
    const shadow  = mockPaymentRepo();
    primary.recordFailedBooking.mockResolvedValue(undefined);
    shadow.recordFailedBooking.mockRejectedValue(new Error("shadow down"));

    const repo = new DualPaymentRepository(primary, shadow);
    await expect(repo.recordFailedBooking(sampleFailedBooking)).resolves.toBeUndefined();
  });

  it("listFailedBookings delegates to primary only", async () => {
    const primary = mockPaymentRepo();
    const shadow  = mockPaymentRepo();
    primary.listFailedBookings.mockResolvedValue([]);

    const repo = new DualPaymentRepository(primary, shadow);
    await repo.listFailedBookings();
    expect(primary.listFailedBookings).toHaveBeenCalled();
    expect(shadow.listFailedBookings).not.toHaveBeenCalled();
  });
});

// ─── DualAuditRepository ─────────────────────────────────────────────────────

describe("DualAuditRepository", () => {
  it("append does not throw when shadow fails", async () => {
    const primary = mockAuditRepo();
    const shadow  = mockAuditRepo();
    primary.append.mockResolvedValue(undefined);
    shadow.append.mockRejectedValue(new Error("shadow down"));

    const repo = new DualAuditRepository(primary, shadow);
    await expect(repo.append("test@example.com", { action: "book" })).resolves.toBeUndefined();
  });

  it("append propagates primary failure", async () => {
    const primary = mockAuditRepo();
    const shadow  = mockAuditRepo();
    primary.append.mockRejectedValue(new Error("primary down"));

    const repo = new DualAuditRepository(primary, shadow);
    await expect(repo.append("test@example.com", { action: "book" })).rejects.toThrow("primary down");
    expect(shadow.append).not.toHaveBeenCalled();
  });

  it("list delegates to primary only", async () => {
    const primary = mockAuditRepo();
    const shadow  = mockAuditRepo();
    primary.list.mockResolvedValue([]);

    const repo = new DualAuditRepository(primary, shadow);
    await repo.list("test@example.com", 10);
    expect(primary.list).toHaveBeenCalledWith("test@example.com", 10);
    expect(shadow.list).not.toHaveBeenCalled();
  });
});
