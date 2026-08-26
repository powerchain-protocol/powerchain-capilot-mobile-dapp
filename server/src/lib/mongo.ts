import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

let client: MongoClient | null = null;

export async function getMongoClient() {
  if (!env.MONGO_URL) return null;
  if (!client) {
    client = new MongoClient(env.MONGO_URL, {
      appName: "powerchain-copilot-mobile",
      serverSelectionTimeoutMS: 3000,
    });
    await client.connect();
  }
  return client;
}

export async function pingMongo() {
  const mongo = await getMongoClient();
  if (!mongo) return { configured: false as const };
  await mongo.db(env.MONGO_DB_NAME).command({ ping: 1 });
  return { configured: true as const };
}

export async function closeMongo() {
  if (!client) return;
  await client.close();
  client = null;
}
