import type { OperationalEvent } from "@powerchain/energy-contracts";
import { config } from "../config.js";
import { prisma } from "../db/prisma.js";
import { broadcastOperationalEvent } from "./publisher.js";

function backoffSeconds(attempt: number) {
  return Math.min(
    Math.max(2 ** Math.max(attempt - 1, 0), 1),
    config.OUTBOX_MAX_BACKOFF_SECONDS,
  );
}

export function startOperationalOutboxWorker(
  log: Pick<Console, "warn"> = console,
) {
  if (!config.SUPABASE_REALTIME_ENABLED) return () => {};

  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const now = new Date();
      const rows = await prisma.operationalOutbox.findMany({
        where: {
          publishedAt: null,
          publishAttempts: { lt: config.OUTBOX_MAX_ATTEMPTS },
          OR: [
            { nextAttemptAt: null },
            { nextAttemptAt: { lte: now } },
          ],
        },
        orderBy: { occurredAt: "asc" },
        take: 50,
      });

      for (const row of rows) {
        const event: OperationalEvent = {
          id: row.id,
          type: row.eventType,
          organizationId: row.organizationId,
          siteId: row.siteId ?? undefined,
          aggregateType: row.aggregateType,
          aggregateId: row.aggregateId,
          aggregateVersion: row.aggregateVersion,
          payload: row.payload as Record<string, unknown>,
          requestId: row.requestId,
          traceId: row.traceId,
          schemaVersion: "1.0.0",
          occurredAt: row.occurredAt.toISOString(),
        };

        const attemptedAt = new Date();
        try {
          const published = await broadcastOperationalEvent(event);
          if (!published) {
            throw new Error("REALTIME_PUBLISH_NOT_ACKNOWLEDGED");
          }
          await prisma.operationalOutbox.update({
            where: { id: row.id },
            data: {
              publishedAt: new Date(),
              publishAttempts: { increment: 1 },
              lastPublishAttemptAt: attemptedAt,
              lastPublishError: null,
              nextAttemptAt: null,
            },
          });
        } catch (error) {
          const nextAttemptNumber = row.publishAttempts + 1;
          const terminal = nextAttemptNumber >= config.OUTBOX_MAX_ATTEMPTS;
          await prisma.operationalOutbox.update({
            where: { id: row.id },
            data: {
              publishAttempts: { increment: 1 },
              lastPublishAttemptAt: attemptedAt,
              lastPublishError:
                error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_PUBLISH_ERROR",
              nextAttemptAt: terminal
                ? null
                : new Date(
                    Date.now() + backoffSeconds(nextAttemptNumber) * 1000,
                  ),
            },
          });
          log.warn("operations outbox publish failed", error);
          // Realtime is one downstream projection. Avoid hammering the provider
          // when it is unavailable; the durable row remains retriable.
          break;
        }
      }
    } finally {
      running = false;
    }
  };

  const timer = setInterval(
    () => void run(),
    config.OUTBOX_POLL_INTERVAL_MS,
  );
  timer.unref?.();
  void run();
  return () => clearInterval(timer);
}
