import { isSqliteDatabaseUrl, seedDemoInventory } from "@stockwise/db";
import { createApp } from "./app.js";
import { getDb, initializeSqliteDatabase } from "./modules/db.js";
import { loadDatabaseEnv } from "./modules/env.js";

loadDatabaseEnv();
if (isSqliteDatabaseUrl(process.env.DATABASE_URL)) {
  await initializeSqliteDatabase();
  const seeded = await seedDemoInventory(getDb());
  if (seeded === "seeded") {
    console.log("Loaded sample inventory into the SQLite demo database");
  } else {
    console.log("SQLite demo database already contains inventory data");
  }
}

const port = Number(process.env.PORT ?? 3001);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const host = "0.0.0.0";
const app = createApp();

const server = app.listen(port, host, () => {
  console.log(`API listening on http://${host}:${port}`);
});
server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(`API failed to listen on port ${port}: ${error.message}`);
  process.exit(1);
});
