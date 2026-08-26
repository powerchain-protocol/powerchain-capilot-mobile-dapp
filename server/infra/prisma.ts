export async function createPrismaClient(connectionString: string) {
  if (!connectionString) throw new Error('DATABASE_URL is required for Prisma runtime.');
  const [{ PrismaClient }, { PrismaPg }] = await Promise.all([
    import('../generated/prisma/client.js'),
    import('@prisma/adapter-pg'),
  ]);
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
