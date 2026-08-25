import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { buildPwrcMessageQuote, getPwrcPricingView } from "../credits/pricing";
import {
  getCreditLedger,
  getFundingHistory,
  getMessageReceipt,
  getPwrcCreditAccountView,
  getPwrcCreditReconciliation,
  grantDemoCredits,
} from "../credits/service";
import {
  createTopupIntent,
  listTopupIntents,
} from "../credits/payment-kernel";

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function registerCreditRoutes(app: FastifyInstance) {
  app.get("/api/v1/credits/pricing", async (request) => {
    await authenticate(request);
    return getPwrcPricingView();
  });

  app.get("/api/v1/credits/quote", async (request) => {
    await authenticate(request);
    return buildPwrcMessageQuote();
  });

  app.get("/api/v1/credits/account", async (request) => {
    const { user } = await authenticate(request);
    return getPwrcCreditAccountView(user.id);
  });

  app.get("/api/v1/credits/reconciliation", async (request) => {
    const { user } = await authenticate(request);
    return getPwrcCreditReconciliation(user.id);
  });

  app.get("/api/v1/credits/ledger", async (request) => {
    const { user } = await authenticate(request);
    const { limit } = listSchema.parse(request.query);
    return { items: await getCreditLedger(user.id, limit) };
  });

  app.get("/api/v1/credits/funding", async (request) => {
    const { user } = await authenticate(request);
    const { limit } = listSchema.parse(request.query);
    return { items: await getFundingHistory(user.id, limit) };
  });

  app.get("/api/v1/credits/topups", async (request) => {
    const { user } = await authenticate(request);
    const { limit } = listSchema.parse(request.query);
    return { items: await listTopupIntents(user.id, limit) };
  });

  app.get("/api/v1/credits/messages/:id", async (request, reply) => {
    const { user } = await authenticate(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const receipt = await getMessageReceipt(user.id, id);
    if (!receipt) {
      return reply.code(404).send({ error: "credit_receipt_not_found" });
    }
    return receipt;
  });

  app.post("/api/v1/credits/demo-grant", async (request) => {
    const { user } = await authenticate(request);
    return grantDemoCredits(user.id);
  });

  app.post("/api/v1/credits/topups", async (request) => {
    const { user } = await authenticate(request);
    const { responses, idempotencyKey } = z
      .object({
        responses: z.union([
          z.literal(50),
          z.literal(250),
          z.literal(500),
          z.literal(1000),
        ]),
        idempotencyKey: z.string().min(16).max(128),
      })
      .parse(request.body);

    return createTopupIntent({
      userId: user.id,
      responses,
      idempotencyKey,
    });
  });
}
