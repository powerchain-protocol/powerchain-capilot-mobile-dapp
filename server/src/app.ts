import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { env } from "./config/env";
import { buildCorsOptions } from "./http/cors-policy";
import { rewriteMobileApiUrl } from "./http/api-namespace";
import { registerHealthRoutes } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerAccountRoutes } from "./routes/account";
import { registerOnboardingRoutes } from "./routes/onboarding";
import { registerWalletRoutes } from "./routes/wallets";
import { registerMarketRoutes } from "./routes/market";
import { registerAiRoutes } from "./routes/ai";
import { registerSolanaRoutes } from "./routes/solana";
import { registerSessionRoutes } from "./routes/sessions";
import { registerConversationRoutes } from "./routes/conversations";
import { registerMarketPriceRoutes } from "./routes/market-price";
import { registerIntegrationRoutes } from "./routes/integrations";
import { registerConfigRoutes } from "./routes/config";
import { registerMcpRoutes } from "./routes/mcp";
import { registerSuiRoutes } from "./routes/sui";
import { registerCreditRoutes } from "./routes/credits";
import { registerPaymentKernelRoutes } from "./routes/payment-kernel";
import { registerCorsRoutes } from "./routes/cors";
import { registerCapilotMobileRoutes } from "./routes/capilot-mobile";
import { startPwrcReservationReaper } from "./credits/reaper";
import { registerSystemSolanaRoutes } from "./routes/system-solana";
import { registerSystemPlatformRoutes } from "./routes/system-platform";
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

  // Namespace metadata is intentionally registered before the rewrite-backed
  // child routes. Exact /api/v1/capilot-mobile remains a real endpoint while
  // /api/v1/capilot-mobile/<safe-root> is rewritten to the canonical handler.
  await registerCapilotMobileRoutes(app);
  await registerCorsRoutes(app);
  await registerHealthRoutes(app);
  await registerConfigRoutes(app);
  await registerMcpRoutes(app);
  await registerAuthRoutes(app);
  await registerAccountRoutes(app);
  await registerOnboardingRoutes(app);
  await registerWalletRoutes(app);
  await registerMarketRoutes(app);
  await registerAiRoutes(app);
  await registerSolanaRoutes(app);
  await registerSystemSolanaRoutes(app);
  await registerSystemPlatformRoutes(app);
  await registerSuiRoutes(app);
  await registerSessionRoutes(app);
  await registerConversationRoutes(app);
  await registerMarketPriceRoutes(app);
  await registerIntegrationRoutes(app);
  await registerCreditRoutes(app);
  await registerPaymentKernelRoutes(app);

  const stopCreditReaper = startPwrcReservationReaper(app.log);
  app.addHook("onClose", async () => {
    stopCreditReaper();
    await Promise.allSettled([closeMongo(), closeRedis()]);
  });

  return app;
}
