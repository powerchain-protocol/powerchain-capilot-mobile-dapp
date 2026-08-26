import { createOperationsApp } from './app.ts';

const { app, config, prisma } = await createOperationsApp(process.env);
const server = app.listen(config.port, config.host, () => {
  console.log(`PowerChain Operations API listening on http://${config.host}:${config.port}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}; stopping operations API.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
