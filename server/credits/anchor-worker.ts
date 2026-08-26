import { buildReceiptMerkleRoot } from './merkle.ts';
import type { CreditStore } from './store.ts';
import type { ReceiptAnchorOutboxEvent } from './types.ts';

export type ReceiptAnchorPublisher = {
  publishMerkleRoot(input: {
    merkleRoot: string;
    receiptIds: string[];
    receiptHashes: string[];
  }): Promise<{ signature: string }>;
};

export type ReceiptAnchorBatchResult = {
  attempted: number;
  published: number;
  failed: number;
  merkleRoot?: string;
  signature?: string;
};

function retryDelayMs(attempts: number) {
  return Math.min(60 * 60 * 1_000, 5_000 * 2 ** Math.min(Math.max(attempts - 1, 0), 8));
}

/**
 * Publishes a batch Merkle root, never one NFT/token per response.
 * The durable outbox remains the retry authority; a Solana RPC failure cannot roll back billing.
 */
export async function publishPendingReceiptAnchorBatch(input: {
  store: CreditStore;
  publisher: ReceiptAnchorPublisher;
  now?: Date;
  limit?: number;
}): Promise<ReceiptAnchorBatchResult> {
  const now = input.now ?? new Date();
  const limit = Math.max(1, Math.min(500, Math.trunc(input.limit ?? 100)));
  const pending = await input.store.transaction((tx) => tx.listPendingReceiptAnchors(limit, now));
  if (pending.length === 0) return { attempted: 0, published: 0, failed: 0 };

  const hashes = pending.map((event) => event.receiptHash);
  const merkleRoot = buildReceiptMerkleRoot(hashes);
  if (!merkleRoot) return { attempted: 0, published: 0, failed: 0 };
  const processing: ReceiptAnchorOutboxEvent[] = pending.map((event) => ({
    ...event,
    status: 'processing',
    attempts: event.attempts + 1,
    availableAt: new Date(now.getTime() + 60_000),
    merkleRoot,
  }));

  // Claim each item before any network I/O. A production SQL store should implement this with
  // row locks/SKIP LOCKED when multiple workers are enabled.
  await input.store.transaction(async (tx) => {
    for (const event of processing) await tx.saveReceiptAnchor(event);
  });

  try {
    const result = await input.publisher.publishMerkleRoot({
      merkleRoot,
      receiptIds: processing.map((event) => event.receiptId),
      receiptHashes: hashes,
    });
    await input.store.transaction(async (tx) => {
      for (const event of processing) {
        await tx.saveReceiptAnchor({
          ...event,
          status: 'published',
          publishedAt: now,
          solanaSignature: result.signature,
        });
      }
    });
    return { attempted: processing.length, published: processing.length, failed: 0, merkleRoot, signature: result.signature };
  } catch (error) {
    await input.store.transaction(async (tx) => {
      for (const event of processing) {
        await tx.saveReceiptAnchor({
          ...event,
          status: 'failed',
          availableAt: new Date(now.getTime() + retryDelayMs(event.attempts)),
        });
      }
    });
    return { attempted: processing.length, published: 0, failed: processing.length, merkleRoot };
  }
}
