import { existsSync, rmSync } from "node:fs";
import { demoDatabaseFile } from "../packages/db/demo-database.mjs";

const file = demoDatabaseFile();
const targets = [file, `${file}-journal`, `${file}-wal`, `${file}-shm`];
let removed = 0;

for (const target of targets) {
  if (!existsSync(target)) {
    continue;
  }
  rmSync(target);
  removed += 1;
  console.log(`Removed ${target}`);
}

if (removed === 0) {
  console.log("No SQLite demo database to remove.");
}

console.log("MySQL data is unchanged. Run pnpm demo to create the demo database again.");
