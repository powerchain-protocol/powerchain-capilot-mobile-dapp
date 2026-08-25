import type { FastifyBaseLogger } from "fastify";
import { env } from "../config/env";
import { expireTopupIntents } from "./payment-kernel";
import { expirePendingResponses } from "./pending-response";
import { releaseExpiredReservations } from "./service";

type TaskName =
  | "reservations"
  | "pendingResponses"
  | "topupIntents";

export function startPwrcReservationReaper(log: FastifyBaseLogger) {
  if (!env.PWRC_CREDIT_REAPER_ENABLED) return () => {};

  let running = false;

  const run = async () => {
    if (running) {
      log.warn("Skipped overlapping PWRC credit maintenance run");
      return;
    }
    running = true;

    try {
      const tasks: Array<[TaskName, Promise<number>]> = [
        ["reservations", releaseExpiredReservations()],
        ["pendingResponses", expirePendingResponses()],
        ["topupIntents", expireTopupIntents()],
      ];

      const results = await Promise.allSettled(
        tasks.map(([, task]) => task),
      );

      const counts: Record<TaskName, number> = {
        reservations: 0,
        pendingResponses: 0,
        topupIntents: 0,
      };

      results.forEach((result, index) => {
        const name = tasks[index]![0];
        if (result.status === "fulfilled") {
          counts[name] = result.value;
        } else {
          log.error(
            { err: result.reason, maintenanceTask: name },
            "PWRC credit maintenance task failed",
          );
        }
      });

      if (Object.values(counts).some((value) => value > 0)) {
        log.info(
          {
            releasedReservations: counts.reservations,
            expiredResponses: counts.pendingResponses,
            expiredTopups: counts.topupIntents,
          },
          "PWRC credit maintenance recovered stale state",
        );
      }
    } finally {
      running = false;
    }
  };

  const timer = setInterval(
    () => void run(),
    env.PWRC_CREDIT_REAPER_INTERVAL_SECONDS * 1000,
  );
  timer.unref();
  void run();
  return () => clearInterval(timer);
}
