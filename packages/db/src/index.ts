import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

export function createPrismaClient(
  connectionString = process.env.DATABASE_URL,
): PrismaClient {
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb(connectionString),
  });
}

export type { PrismaClient };
