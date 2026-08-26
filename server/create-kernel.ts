import { createCreditsApiHandler, type RequestAuthenticator } from './api/credits-handler.ts';
import { createMeteredCopilotHandler } from './api/metered-copilot-handler.ts';
import type { MeteredCopilotGenerator } from './copilot/metered-response.ts';
import type { ChatPersistence } from './chat/types.ts';
import { PostgresCreditStore, type TransactionalSqlClient } from './credits/postgres-store.ts';
import { PwrcCreditService } from './credits/service.ts';
import { createEd25519ReceiptSigner } from './credits/signing.ts';

function requireProductionSecret(secret: string) {
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('PAYMENT_KERNEL_WEBHOOK_SECRET must contain at least 32 bytes.');
  }
  return secret;
}

function requireReceiptSigner(privateKeyPem: string, keyId: string) {
  if (!privateKeyPem.trim()) throw new Error('PWRC_RECEIPT_SIGNING_PRIVATE_KEY_PEM is required.');
  if (!keyId.trim()) throw new Error('PWRC_RECEIPT_SIGNING_KEY_ID is required.');
  return createEd25519ReceiptSigner({ privateKeyPem, keyId });
}

export function createPwrcCreditKernel(input: {
  database: TransactionalSqlClient;
  authenticate: RequestAuthenticator;
  generateCopilotResponse: MeteredCopilotGenerator;
  solanaPayRecipient: string;
  paymentKernelWebhookSecret: string;
  receiptSigningPrivateKeyPem: string;
  receiptSigningKeyId: string;
  chat?: ChatPersistence | null;
}) {
  const store = new PostgresCreditStore(input.database);
  const receiptSigner = requireReceiptSigner(input.receiptSigningPrivateKeyPem, input.receiptSigningKeyId);
  const credits = new PwrcCreditService(store, { solanaPayRecipient: input.solanaPayRecipient, receiptSigner });
  const paymentKernelWebhookSecret = requireProductionSecret(input.paymentKernelWebhookSecret);

  return {
    credits,
    creditsApi: createCreditsApiHandler({
      credits,
      authenticate: input.authenticate,
      paymentKernelWebhookSecret,
    }),
    copilotApi: createMeteredCopilotHandler({
      credits,
      authenticate: input.authenticate,
      generate: input.generateCopilotResponse,
      chat: input.chat,
    }),
    recoverExpiredReservations: (now = new Date(), limit = 100) =>
      credits.recoverExpiredReservations(now, limit),
  };
}
