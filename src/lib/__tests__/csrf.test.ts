import { isValidOrigin } from "@/lib/csrf";

function mockReq(origin: string | null): any {
  return { headers: { get: (k: string) => (k === "origin" ? origin : null) } };
}

describe("isValidOrigin", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://gustavoai.dev";
  });

  it("accepts the configured origin", () => {
    expect(isValidOrigin(mockReq("https://gustavoai.dev"))).toBe(true);
  });

  it("rejects a different origin", () => {
    expect(isValidOrigin(mockReq("https://evil.com"))).toBe(false);
  });

  it("rejects missing origin", () => {
    expect(isValidOrigin(mockReq(null))).toBe(false);
  });

  it("rejects malformed origin", () => {
    expect(isValidOrigin(mockReq("not-a-url"))).toBe(false);
  });

  it("rejects when NEXT_PUBLIC_BASE_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    expect(isValidOrigin(mockReq("https://gustavoai.dev"))).toBe(false);
  });
});
