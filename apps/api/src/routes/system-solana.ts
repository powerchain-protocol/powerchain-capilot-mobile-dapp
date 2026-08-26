import type { FastifyInstance } from "fastify";
import { sanitizedSolanaRuntime } from "../config/solana.js";

export async function registerSystemSolanaRoutes(app: FastifyInstance) {
  app.get("/api/v1/system/solana", async () => sanitizedSolanaRuntime());
}
