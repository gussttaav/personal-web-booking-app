import { isValidEmail, isValidPackSize, sanitizeEmail, sanitizeName } from "@/lib/validation";

// ─── isValidEmail ─────────────────────────────────────────────────────────────

describe("isValidEmail", () => {
  it("accepts standard email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name+tag@sub.domain.org")).toBe(true);
    expect(isValidEmail("  user@example.com  ")).toBe(true); // trims whitespace
  });

  it("rejects obviously invalid strings", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("missing@tld")).toBe(false);   // no dot after @
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("spaces in@email.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail({})).toBe(false);
  });
});

// ─── isValidPackSize ──────────────────────────────────────────────────────────

describe("isValidPackSize", () => {
  it("accepts valid pack sizes", () => {
    expect(isValidPackSize(5)).toBe(true);
    expect(isValidPackSize(10)).toBe(true);
  });

  it("rejects any other number", () => {
    expect(isValidPackSize(0)).toBe(false);
    expect(isValidPackSize(1)).toBe(false);
    expect(isValidPackSize(7)).toBe(false);
    expect(isValidPackSize(100)).toBe(false);
    expect(isValidPackSize(-5)).toBe(false);
  });

  it("rejects string versions of valid sizes", () => {
    expect(isValidPackSize("5")).toBe(false);
    expect(isValidPackSize("10")).toBe(false);
  });

  it("rejects null/undefined/object", () => {
    expect(isValidPackSize(null)).toBe(false);
    expect(isValidPackSize(undefined)).toBe(false);
    expect(isValidPackSize({})).toBe(false);
  });
});

// ─── sanitizeEmail ────────────────────────────────────────────────────────────

describe("sanitizeEmail", () => {
  it("lowercases and trims whitespace", () => {
    expect(sanitizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeEmail("")).toBe("");
  });

  it("preserves already-clean emails", () => {
    expect(sanitizeEmail("user@example.com")).toBe("user@example.com");
  });
});

// ─── sanitizeName ─────────────────────────────────────────────────────────────

describe("sanitizeName", () => {
  it("trims leading/trailing whitespace", () => {
    expect(sanitizeName("  Gustavo Torres  ")).toBe("Gustavo Torres");
  });

  it("truncates names longer than 100 characters", () => {
    const longName = "A".repeat(150);
    expect(sanitizeName(longName)).toHaveLength(100);
  });

  it("preserves normal names unchanged", () => {
    expect(sanitizeName("Ana García")).toBe("Ana García");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeName("   ")).toBe("");
  });
});
