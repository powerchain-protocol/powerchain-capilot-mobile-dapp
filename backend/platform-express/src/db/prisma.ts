import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { config } from "../config.js";

const adapter = new PrismaPg({ connectionString: config.ENERGY_DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
