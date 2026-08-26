import { createClient, type RedisClientType } from "redis";
import { env } from "../config/env.js";

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

export async function getRedisClient() {
  if (!env.REDIS_URL) return null;
  if (client?.isOpen) return client;
  if (!connecting) {
    connecting = (async () => {
      const next = createClient({ url: env.REDIS_URL });
      next.on("error", () => undefined);
      await next.connect();
      client = next as RedisClientType;
      return client;
    })().finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

export async function pingRedis() {
  const redis = await getRedisClient();
  if (!redis) return { configured: false as const };
  await redis.ping();
  return { configured: true as const };
}

export async function closeRedis() {
  if (!client?.isOpen) return;
  await client.quit();
  client = null;
}
