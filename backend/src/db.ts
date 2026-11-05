import { PrismaClient } from "@prisma/client";

const globalDb = globalThis as unknown as { ssc13Prisma?: PrismaClient };
export const databaseConfigured = () => Boolean(process.env.DATABASE_URL);
export function db(): PrismaClient {
  if (!databaseConfigured()) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!globalDb.ssc13Prisma) globalDb.ssc13Prisma = new PrismaClient();
  return globalDb.ssc13Prisma;
}
