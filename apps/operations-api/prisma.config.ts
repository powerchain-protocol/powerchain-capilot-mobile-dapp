import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.OPERATIONS_DATABASE_URL ?? process.env.ENERGY_DATABASE_URL;
if (!url) throw new Error("OPERATIONS_DATABASE_URL is required.");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url },
});
