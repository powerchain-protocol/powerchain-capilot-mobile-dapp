export async function createOptionalMongo(input: { url: string; dbName: string }) {
  if (!input.url) return null;
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(input.url);
  await client.connect();
  return { client, db: client.db(input.dbName) };
}

export async function createOptionalRedis(url: string) {
  if (!url) return null;
  const { default: Redis } = await import('ioredis');
  return new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
}
