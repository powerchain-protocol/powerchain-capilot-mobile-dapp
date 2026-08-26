import express from "express";
import { ZodError } from "zod";
import { allowedOrigins, config } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { configRouter } from "./routes/config.js";
import { emsRouter } from "./routes/ems.js";
import { iotRouter } from "./routes/iot.js";
import { depinRouter } from "./routes/depin.js";
import { safeActionsRouter } from "./routes/safe-actions.js";

export function buildEnergyPlatformApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "128kb" }));

  app.use((request, response, next) => {
    const origin = request.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      response.setHeader("access-control-allow-origin", origin);
      response.setHeader("vary", "Origin");
      response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
      response.setHeader(
        "access-control-allow-headers",
        "Authorization,Content-Type,Idempotency-Key,If-Match,X-Request-Id,X-User-Id,X-Organization-Id",
      );
    }
    if (request.method === "OPTIONS") {
      if (origin && !allowedOrigins.has(origin)) return response.status(403).end();
      return response.status(204).end();
    }
    next();
  });

  const prefix = config.ENERGY_API_PREFIX;
  app.use(`${prefix}/health`, healthRouter);
  app.use(`${prefix}/config`, configRouter);
  app.use(`${prefix}/ems`, emsRouter);
  app.use(`${prefix}/iot`, iotRouter);
  app.use(`${prefix}/depin`, depinRouter);
  app.use(`${prefix}/safe-actions`, safeActionsRouter);

  app.use((error: unknown, request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      return response.status(400).json({
        error: "VALIDATION_ERROR",
        details: error.flatten(),
      });
    }
    const typed = error as Error & { statusCode?: number };
    const status = typed.statusCode ?? 500;
    if (status >= 500) {
      console.error("energy-platform error", {
        method: request.method,
        path: request.path,
        message: typed.message,
      });
    }
    response.status(status).json({
      error: typed.message || "INTERNAL_ERROR",
    });
  });

  return app;
}
