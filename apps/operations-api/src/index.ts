import { buildOperationsApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db/prisma.js";
import { startOperationalOutboxWorker } from "./events/outbox-worker.js";
import { startSafeActionReaper } from "./events/safe-action-reaper.js";

const app = buildOperationsApp();
const stopOutbox = startOperationalOutboxWorker();
const stopSafeActionReaper = startSafeActionReaper();
const server = app.listen(
  config.OPERATIONS_API_PORT,
  config.OPERATIONS_API_HOST,
  () =>
    console.log(
      `PowerChain Operations API ${config.OPERATIONS_API_PREFIX} on ${config.OPERATIONS_API_HOST}:${config.OPERATIONS_API_PORT}`,
    ),
);

async function shutdown() {
  stopOutbox();
  stopSafeActionReaper();
  server.close();
  await prisma.$disconnect();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
