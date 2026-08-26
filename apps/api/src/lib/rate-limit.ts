import { createHash } from "node:crypto";
import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { env } from "../config/env.js";
import { getRedisClient } from "./redis.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function identityHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

async function consumeMemory(key: string, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  const bucket =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    count: bucket.count,
    resetAt: bucket.resetAt,
  };
}

async function consumeRedis(key: string, windowMs: number) {
  const redis = await getRedisClient();
  if (!redis) return consumeMemory(key, windowMs);

  const redisKey = `powerchain:ratelimit:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.pExpire(redisKey, windowMs);
  }
  const ttl = await redis.pTTL(redisKey);
  return {
    count,
    resetAt: Date.now() + Math.max(ttl, 0),
  };
}

export function rateLimit(options: {
  namespace: string;
  limit: number;
  windowMs: number;
  key?: (request: FastifyRequest) => string;
}) {
  return async function handler(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const identity =
      options.key?.(request) ??
      request.headers.authorization ??
      request.ip;

    const bucketKey = `${options.namespace}:${identityHash(identity)}`;
    const bucket =
      env.RATE_LIMIT_STORE === "redis"
        ? await consumeRedis(bucketKey, options.windowMs)
        : await consumeMemory(bucketKey, options.windowMs);

    reply.header("X-RateLimit-Limit", String(options.limit));
    reply.header(
      "X-RateLimit-Remaining",
      String(Math.max(0, options.limit - bucket.count)),
    );

    if (bucket.count > options.limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((bucket.resetAt - Date.now()) / 1000),
      );
      reply.header("Retry-After", String(retryAfter));
      return reply.code(429).send({
        error: "rate_limited",
        message: "Too many requests. Try again shortly.",
        retryAfter,
      });
    }
  };
}
