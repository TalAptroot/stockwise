import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// apps/api/src/modules/env.ts -> repo packages/db/.env.
// pnpm runs package scripts from apps/api, so the path is based on this file.
const databaseEnvPath = fileURLToPath(new URL("../../../../packages/db/.env", import.meta.url));

let loaded = false;

export function loadDatabaseEnv(): void {
  if (loaded) {
    return;
  }

  let contents: string;
  try {
    contents = readFileSync(databaseEnvPath, "utf8");
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code === "ENOENT") {
      loaded = true;
    }
    return;
  }

  let parsed: { [key: string]: string };
  try {
    parsed = dotenv.parse(contents);
  } catch {
    return;
  }

  const databaseUrl = parsed["DATABASE_URL"];
  if (typeof databaseUrl === "string" && databaseUrl.length > 0) {
    const current = process.env["DATABASE_URL"];
    if (current === undefined || current.length === 0) {
      process.env["DATABASE_URL"] = databaseUrl;
    }
  }

  loaded = true;
}
