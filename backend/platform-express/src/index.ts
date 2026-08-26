import { buildEnergyPlatformApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db/prisma.js";

const app = buildEnergyPlatformApp();
const server = app.listen(config.ENERGY_API_PORT, config.ENERGY_API_HOST, () => {
  console.log(
    `PowerChain Energy Platform backend ${config.ENERGY_API_PREFIX} on ${config.ENERGY_API_HOST}:${config.ENERGY_API_PORT}`,
  );
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
