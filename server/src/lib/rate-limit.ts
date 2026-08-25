import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

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

    const bucketKey = `${options.namespace}:${identity}`;
    const now = Date.now();
    const current = buckets.get(bucketKey);

    const bucket =
      !current || current.resetAt <= now
        ? {
            count: 0,
            resetAt: now + options.windowMs,
          }
        : current;

    bucket.count += 1;
    buckets.set(bucketKey, bucket);

    reply.header(
      "X-RateLimit-Limit",
      String(options.limit),
    );
    reply.header(
      "X-RateLimit-Remaining",
      String(Math.max(0, options.limit - bucket.count)),
    );

    if (bucket.count > options.limit) {
      const retryAfter = Math.ceil(
        (bucket.resetAt - now) / 1000,
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
