/**
 * Unit tests for lib/sheets.ts
 *
 * Strategy: mock the `googleapis` module so no real HTTP calls are made.
 * Each test configures the mock return values to simulate different sheet states,
 * then asserts on the public API functions (getCredits, addOrUpdateStudent,
 * decrementCredit).
 */

// ─── Mock setup ───────────────────────────────────────────────────────────────
// jest.mock() is hoisted before ANY variable declaration, including var.
// The only safe way to reference a variable inside the factory is to use
// jest.fn() directly there and retrieve the reference afterward via
// the mocked module itself.

jest.mock("googleapis", () => {
  const mockGet = jest.fn();
  const mockUpdate = jest.fn();
  const mockAppend = jest.fn();

  return {
    google: {
      auth: {
        GoogleAuth: jest.fn().mockImplementation(() => ({})),
      },
      sheets: jest.fn().mockReturnValue({
        spreadsheets: {
          values: { get: mockGet, update: mockUpdate, append: mockAppend },
        },
      }),
    },
  };
});

// Pull the stable jest.fn() references out of the already-mocked module.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { google } = require("googleapis") as typeof import("googleapis");
const sheetsMock = (google.sheets as jest.Mock)();
const mockGet    = sheetsMock.spreadsheets.values.get    as jest.Mock;
const mockUpdate = sheetsMock.spreadsheets.values.update as jest.Mock;
const mockAppend = sheetsMock.spreadsheets.values.append as jest.Mock;

// Provide the required env vars before sheets.ts is imported
process.env.GOOGLE_SHEET_ID = "test-sheet-id";
process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "test@test.iam.gserviceaccount.com";
process.env.GOOGLE_PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\\ntest\\n-----END RSA PRIVATE KEY-----";

import { getCredits, addOrUpdateStudent, decrementCredit } from "@/lib/sheets";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a sheets row array matching the COL indices used by sheets.ts */
function makeRow(
  email: string,
  name: string,
  credits: number,
  packLabel: string,
  expiresAt: string,
  lastUpdated = new Date().toISOString(),
  stripeSessionId = ""
): string[] {
  return [email, name, String(credits), packLabel, expiresAt, lastUpdated, stripeSessionId];
}

function futureDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

function pastDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
}

// ─── getCredits ───────────────────────────────────────────────────────────────

describe("getCredits", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when the student is not found", async () => {
    mockGet.mockResolvedValueOnce({ data: { values: [] } });
    const result = await getCredits("unknown@example.com");
    expect(result).toBeNull();
  });

  it("returns correct credits and name for an existing student", async () => {
    const row = makeRow("student@example.com", "Ana García", 5, "Pack 5", futureDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });

    const result = await getCredits("student@example.com");
    expect(result).not.toBeNull();
    expect(result!.credits).toBe(5);
    expect(result!.name).toBe("Ana García");
    expect(result!.packSize).toBe(5);
  });

  it("returns 0 credits when the pack is expired", async () => {
    const row = makeRow("student@example.com", "Ana García", 5, "Pack 5", pastDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });

    const result = await getCredits("student@example.com");
    expect(result!.credits).toBe(0);
  });

  it("is case-insensitive for email lookup", async () => {
    const row = makeRow("Student@EXAMPLE.COM", "Beto Ruiz", 3, "Pack 10", futureDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });

    const result = await getCredits("student@example.com");
    expect(result).not.toBeNull();
    expect(result!.credits).toBe(3);
  });

  it("parses pack size 10 correctly", async () => {
    const row = makeRow("a@b.com", "X", 10, "Pack 10", futureDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });

    const result = await getCredits("a@b.com");
    expect(result!.packSize).toBe(10);
  });

  it("returns packSize null when packLabel is unrecognised", async () => {
    const row = makeRow("a@b.com", "X", 2, "Desconocido", futureDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });

    const result = await getCredits("a@b.com");
    expect(result!.packSize).toBeNull();
  });
});

// ─── addOrUpdateStudent ───────────────────────────────────────────────────────

describe("addOrUpdateStudent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("appends a new row when the student does not exist", async () => {
    mockGet.mockResolvedValueOnce({ data: { values: [] } });
    mockAppend.mockResolvedValueOnce({});

    await addOrUpdateStudent("new@example.com", "Carlos", 5, "Pack 5", "cs_test_abc");

    expect(mockAppend).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();

    const appendedValues = mockAppend.mock.calls[0][0].requestBody.values[0];
    expect(appendedValues[0]).toBe("new@example.com");
    expect(appendedValues[2]).toBe(5);
    expect(appendedValues[6]).toBe("cs_test_abc");
  });

  it("updates an existing row and accumulates credits", async () => {
    const existingRow = makeRow("student@example.com", "Ana", 3, "Pack 5", futureDate());
    mockGet.mockResolvedValueOnce({ data: { values: [existingRow] } });
    mockUpdate.mockResolvedValueOnce({});

    await addOrUpdateStudent("student@example.com", "Ana", 5, "Pack 5", "cs_test_new");

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updatedValues = mockUpdate.mock.calls[0][0].requestBody.values[0];
    expect(updatedValues[2]).toBe(8); // 3 existing + 5 new
    expect(updatedValues[6]).toBe("cs_test_new");
  });

  it("skips the update when the stripe session id was already processed (idempotency)", async () => {
    const existingRow = makeRow("student@example.com", "Ana", 3, "Pack 5", futureDate(), "", "cs_already_done");
    mockGet.mockResolvedValueOnce({ data: { values: [existingRow] } });

    await addOrUpdateStudent("student@example.com", "Ana", 5, "Pack 5", "cs_already_done");

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAppend).not.toHaveBeenCalled();
  });

  it("resets credits to 0 and re-adds when the existing pack is expired", async () => {
    const expiredRow = makeRow("student@example.com", "Ana", 3, "Pack 5", pastDate());
    mockGet.mockResolvedValueOnce({ data: { values: [expiredRow] } });
    mockUpdate.mockResolvedValueOnce({});

    await addOrUpdateStudent("student@example.com", "Ana", 5, "Pack 5", "cs_new");

    const updatedValues = mockUpdate.mock.calls[0][0].requestBody.values[0];
    expect(updatedValues[2]).toBe(5); // expired credits reset to 0, only new 5 added
  });
});

// ─── decrementCredit ─────────────────────────────────────────────────────────

describe("decrementCredit", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns ok:false when the student is not found", async () => {
    mockGet.mockResolvedValueOnce({ data: { values: [] } });
    const result = await decrementCredit("ghost@example.com");
    expect(result).toEqual({ ok: false, remaining: 0 });
  });

  it("returns ok:false when the pack is expired", async () => {
    const row = makeRow("a@b.com", "X", 5, "Pack 5", pastDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });

    const result = await decrementCredit("a@b.com");
    expect(result).toEqual({ ok: false, remaining: 0 });
  });

  it("returns ok:false when credits are already 0", async () => {
    const row = makeRow("a@b.com", "X", 0, "Pack 5", futureDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });

    const result = await decrementCredit("a@b.com");
    expect(result).toEqual({ ok: false, remaining: 0 });
  });

  it("decrements credits by 1 and returns remaining", async () => {
    const row = makeRow("a@b.com", "X", 4, "Pack 5", futureDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });
    mockUpdate.mockResolvedValueOnce({});

    const result = await decrementCredit("a@b.com");
    expect(result).toEqual({ ok: true, remaining: 3 });

    const updatedValues = mockUpdate.mock.calls[0][0].requestBody.values[0];
    expect(updatedValues[2]).toBe(3);
  });

  it("handles the last credit correctly (remaining becomes 0)", async () => {
    const row = makeRow("a@b.com", "X", 1, "Pack 5", futureDate());
    mockGet.mockResolvedValueOnce({ data: { values: [row] } });
    mockUpdate.mockResolvedValueOnce({});

    const result = await decrementCredit("a@b.com");
    expect(result).toEqual({ ok: true, remaining: 0 });
  });
});
