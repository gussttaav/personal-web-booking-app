import { cacheTTLSeconds } from "@/lib/availability-cache";

describe("cacheTTLSeconds", () => {
  it("returns 0 for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(cacheTTLSeconds(today)).toBe(0);
  });

  it("returns 0 for tomorrow", () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    expect(cacheTTLSeconds(d.toISOString().slice(0, 10))).toBe(0);
  });

  it("returns 300 for 3 days ahead", () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    expect(cacheTTLSeconds(d.toISOString().slice(0, 10))).toBe(300);
  });

  it("returns 300 for 7 days ahead", () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    expect(cacheTTLSeconds(d.toISOString().slice(0, 10))).toBe(300);
  });

  it("returns 900 for 14 days ahead", () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    expect(cacheTTLSeconds(d.toISOString().slice(0, 10))).toBe(900);
  });
});
