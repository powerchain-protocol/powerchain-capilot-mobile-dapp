import { config } from "../config.js";
import { prisma } from "../db/prisma.js";

export async function expirePreparedSafeActions(now = new Date()) {
  const candidates = await prisma.safeAction.findMany({
    where: {
      expiresAt: { lte: now },
      state: { notIn: ["EXPIRED", "REJECTED"] },
    },
    orderBy: { expiresAt: "asc" },
    take: 100,
  });

  let expired = 0;
  for (const candidate of candidates) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.safeAction.updateMany({
        where: {
          id: candidate.id,
          resourceVersion: candidate.resourceVersion,
          state: candidate.state,
        },
        data: {
          state: "EXPIRED",
          resourceVersion: { increment: 1 },
        },
      });
      if (updated.count !== 1) return;

      await tx.operationalOutbox.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: candidate.organizationId,
          siteId: candidate.siteId,
          aggregateType: "SafeAction",
          aggregateId: candidate.id,
          aggregateVersion: candidate.resourceVersion + 1,
          eventType: "operations.safe_action.expired",
          schemaVersion: "1.0.0",
          payload: {
            type: candidate.type,
            intentHash: candidate.intentHash,
          },
          requestId: candidate.requestId,
          traceId: candidate.traceId,
          occurredAt: now,
        },
      });
      expired += 1;
    });
  }
  return expired;
}

export function startSafeActionReaper(
  log: Pick<Console, "warn"> = console,
) {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await expirePreparedSafeActions();
    } catch (error) {
      log.warn("safe action reaper failed", error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(
    () => void run(),
    config.SAFE_ACTION_REAPER_INTERVAL_MS,
  );
  timer.unref?.();
  void run();
  return () => clearInterval(timer);
}
