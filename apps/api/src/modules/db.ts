import {
  createPrismaClient,
  createSqlitePrismaClient,
  isSqliteDatabaseUrl,
  type PrismaClient,
} from "@stockwise/db";
import { loadDatabaseEnv } from "./env.js";

let client: PrismaClient | undefined;

export async function initializeSqliteDatabase(): Promise<void> {
  loadDatabaseEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!isSqliteDatabaseUrl(connectionString)) {
    return;
  }
  if (client === undefined) {
    client = await createSqlitePrismaClient(connectionString);
  }
}

export function getDb(): PrismaClient {
  if (client !== undefined) {
    return client;
  }

  loadDatabaseEnv();
  const connectionString = process.env.DATABASE_URL;
  if (isSqliteDatabaseUrl(connectionString)) {
    throw new Error("SQLite demo database is not ready");
  }

  client = createPrismaClient();
  return client;
}
