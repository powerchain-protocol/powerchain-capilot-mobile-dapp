import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { env } from "./config/env";
import { buildCorsOptions } from "./http/cors-policy";
import { rewriteMobileApiUrl } from "./http/api-namespace";
import { registerApiV1 } from "../v1/register";
import { startPwrcReservationReaper } from "./credits/reaper";
import { rateLimit } from "./lib/rate-limit";
import { closeMongo } from "./lib/mongo";
import { closeRedis } from "./lib/redis";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
    trustProxy: env.TRUST_PROXY,
    bodyLimit: env.BODY_LIMIT_BYTES,
    genReqId: () => crypto.randomUUID(),
    rewriteUrl: (request) => rewriteMobileApiUrl(request.url),
  });

  await app.register(cors, buildCorsOptions());

  const globalLimiter = rateLimit({
    namespace: "global-rate-limit",
    limit: env.GLOBAL_RATE_LIMIT,
    windowMs: env.GLOBAL_RATE_WINDOW_MS,
  });
  app.addHook("onRequest", async (request, reply) => {
    if (/\/health\/(?:live|ready)(?:\?|$)/.test(request.url)) return;
    return globalLimiter(request, reply);
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "validation_error",
        message: "Request validation failed.",
        details: error.flatten(),
        requestId: request.id,
      });
    }

    const statusCode =
      typeof (error as any).statusCode === "number"
        ? (error as any).statusCode
        : 500;

    request.log.error(error);

    const typed = error as Error & { code?: string; details?: unknown };

    return reply.code(statusCode).send({
      error:
        typed.code ??
        (statusCode >= 500 ? "internal_error" : "request_error"),
      message: error.message,
      details: typed.details,
      requestId: request.id,
    });
  });

  await registerApiV1(app);

  const stopCreditReaper = startPwrcReservationReaper(app.log);
  app.addHook("onClose", async () => {
    stopCreditReaper();
    await Promise.allSettled([closeMongo(), closeRedis()]);
  });

  return app;
}
