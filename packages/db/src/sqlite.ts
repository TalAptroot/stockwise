import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma-sqlite/client.js";
import { toSqliteAdapterUrl } from "../demo-database.mjs";
import type { PrismaClient as AppPrismaClient } from "../generated/prisma/client.js";

export async function openSqliteClient(connectionString: string): Promise<AppPrismaClient> {
  const client = new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: toSqliteAdapterUrl(connectionString),
    }),
  });

  // better-sqlite3 leaves foreign keys off. One connection serves every query,
  // so this pragma stays on for later product deletes and movement writes.
  await client.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  return client as unknown as AppPrismaClient;
}
