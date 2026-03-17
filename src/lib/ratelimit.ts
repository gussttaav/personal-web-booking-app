import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
// Free tier at https://console.upstash.com — one database is enough for all limiters.
const redis = Redis.fromEnv();

// AI chat: 20 messages per minute per IP
export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:chat",
});

// Credits check: 60 requests per minute per IP
// (the poller calls this repeatedly, so the limit needs headroom)
export const creditsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "rl:credits",
});

// Stripe checkout: 10 requests per minute per IP
// (a real user never needs more than 1-2; this stops automated abuse)
export const checkoutRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:checkout",
});
