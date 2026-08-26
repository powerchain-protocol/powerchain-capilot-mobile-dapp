import type { RequestHandler } from "express";
import { config } from "../config.js";
import { internalBearerMatches } from "./adapter.js";

export const requireInternalIngestion: RequestHandler = (request, response, next) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
  if (!internalBearerMatches(token, config.INGESTION_INTERNAL_SECRET)) {
    return response.status(401).json({ error: "INGESTION_AUTH_INVALID", requestId: request.requestId });
  }
  return next();
};
