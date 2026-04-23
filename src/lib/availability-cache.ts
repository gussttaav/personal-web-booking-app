// PERF-10 — Tiered availability caching.
// Cache key format: avail:{date}:{duration}
// TTL depends on how far out the date is; cache is invalidated on any
// booking create/cancel that affects the date.
import { kv } from "@/infrastructure/redis/client";

export function cacheTTLSeconds(date: string): number {
  const daysAhead = Math.floor(
    (new Date(date).getTime() - Date.now()) / 86_400_000
  );
  if (daysAhead <= 1) return 0;
  if (daysAhead <= 7) return 300;
  return 900;
}

export function cacheKey(date: string, duration: number): string {
  return `avail:${date}:${duration}`;
}

export async function getCached<T>(date: string, duration: number): Promise<T | null> {
  const ttl = cacheTTLSeconds(date);
  if (ttl === 0) return null;
  return kv.get<T>(cacheKey(date, duration));
}

export async function setCached<T>(date: string, duration: number, value: T): Promise<void> {
  const ttl = cacheTTLSeconds(date);
  if (ttl === 0) return;
  await kv.set(cacheKey(date, duration), value, { ex: ttl });
}

export async function invalidate(date: string): Promise<void> {
  await Promise.all([15, 30, 60, 120].map(d => kv.del(cacheKey(date, d))));
}
