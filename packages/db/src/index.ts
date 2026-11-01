import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
import { isSqliteDatabaseUrl } from "../demo-database.mjs";

export function createPrismaClient(
  connectionString = process.env.DATABASE_URL,
): PrismaClient {
  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error("DATABASE_URL is not set");
  }
  if (isSqliteDatabaseUrl(connectionString)) {
    throw new Error("SQLite demo mode uses createSqlitePrismaClient");
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb(connectionString),
  });
}

export async function createSqlitePrismaClient(connectionString: string): Promise<PrismaClient> {
  if (!isSqliteDatabaseUrl(connectionString)) {
    throw new Error("SQLite demo mode requires a file: database URL");
  }

  const { openSqliteClient } = await import("./sqlite.js");
  return openSqliteClient(connectionString);
}

export { isSqliteDatabaseUrl } from "../demo-database.mjs";
export { seedDemoInventory } from "./seed-demo.js";
export type { PrismaClient };
