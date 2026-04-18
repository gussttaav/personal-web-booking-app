/**
 * REL-04 — Integration tests for chat rate limiters.
 * These tests hit a real Upstash instance. Skip in CI if UPSTASH_* env vars are absent.
 */

import { chatRatelimitAnon, chatRatelimitAnonDaily } from "@/lib/ratelimit";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const describeIntegration = hasUpstash ? describe : describe.skip;

describeIntegration("chat rate limits", () => {
  it("allows up to 5 anonymous requests per minute then blocks the 6th", async () => {
    const ip = `test-anon-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const { success } = await chatRatelimitAnon.limit(ip);
      expect(success).toBe(true);
    }
    const { success } = await chatRatelimitAnon.limit(ip);
    expect(success).toBe(false);
  });

  it("allows up to 30 anonymous requests per day then blocks the 31st", async () => {
    const ip = `test-daily-${Date.now()}`;
    for (let i = 0; i < 30; i++) {
      const { success } = await chatRatelimitAnonDaily.limit(ip);
      expect(success).toBe(true);
    }
    const { success } = await chatRatelimitAnonDaily.limit(ip);
    expect(success).toBe(false);
  }, 30_000);
});
