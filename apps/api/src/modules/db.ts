import { createPrismaClient, type PrismaClient } from "@stockwise/db";
import { loadDatabaseEnv } from "./env.js";

let client: PrismaClient | undefined;

export function getDb(): PrismaClient {
  loadDatabaseEnv();
  if (client === undefined) {
    client = createPrismaClient();
  }
  return client;
}
