export type RateLimitState = { count: number; resetAt: number };
export interface RateLimitStore {
  increment(key: string, windowMs: number, now?: number): Promise<RateLimitState>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, RateLimitState>();
  async increment(key: string, windowMs: number, now = Date.now()) {
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const state = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, state);
      return state;
    }
    existing.count += 1;
    return { ...existing };
  }
}

export type RedisLike = { incr(key: string): Promise<number>; pexpire(key: string, ttlMs: number): Promise<unknown>; pttl(key: string): Promise<number> };
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly redis: RedisLike) {}
  async increment(key: string, windowMs: number, now = Date.now()) {
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.pexpire(key, windowMs);
    const ttl = await this.redis.pttl(key);
    return { count, resetAt: now + Math.max(ttl, 0) };
  }
}
