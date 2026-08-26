import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Prisma ORM v7 removed datasource.directUrl. When DIRECT_URL is present,
  // CLI/migration commands use it; runtime services continue to use DATABASE_URL.
  datasource: {
    url: process.env.DIRECT_URL?.trim() || env('DATABASE_URL'),
  },
});
