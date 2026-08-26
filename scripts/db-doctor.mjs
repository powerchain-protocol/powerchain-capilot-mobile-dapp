const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error('[PowerChain DB] DATABASE_URL is not configured.');
  process.exit(1);
}
let parsed;
try { parsed = new URL(databaseUrl); } catch { console.error('[PowerChain DB] DATABASE_URL is not a valid URL.'); process.exit(1); }
if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
  console.error('[PowerChain DB] DATABASE_URL must use postgres:// or postgresql://.');
  process.exit(1);
}
console.log(`[PowerChain DB] PostgreSQL configured for ${parsed.hostname}:${parsed.port || '5432'}/${parsed.pathname.replace(/^\//, '') || '(default)'}.`);
console.log(`[PowerChain DB] Prisma CLI source: ${process.env.DIRECT_URL?.trim() ? 'DIRECT_URL' : 'DATABASE_URL'}.`);
console.log(`[PowerChain DB] MongoDB auxiliary integration: ${process.env.MONGO_URL?.trim() ? 'configured' : 'disabled'}.`);
console.log(`[PowerChain DB] Redis infrastructure: ${process.env.REDIS_URL?.trim() ? 'configured' : 'disabled'}.`);
