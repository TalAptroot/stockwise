import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

export function demoDatabaseFile() {
  return path.join(packageDir, "data", "demo.db");
}

export function demoDatabaseUrl() {
  const override = process.env.STOCKWISE_DEMO_DATABASE_URL;
  if (override !== undefined && override.length > 0) {
    return toSqliteAdapterUrl(override);
  }

  const file = demoDatabaseFile();
  mkdirSync(path.dirname(file), { recursive: true });
  return `file:${file.replaceAll("\\", "/")}`;
}

// @prisma/adapter-better-sqlite3 7.10 strips one "file:" prefix and does not parse
// file:// URLs. better-sqlite3 then receives the remaining path, spaces included.
export function toSqliteAdapterUrl(connectionString) {
  if (!isSqliteDatabaseUrl(connectionString)) {
    throw new Error("SQLite demo mode requires a file: database URL");
  }

  const rest = connectionString.slice("file:".length);
  if (!rest.startsWith("//")) {
    return connectionString;
  }

  const parsed = new URL(connectionString);
  let pathname = decodeURIComponent(parsed.pathname);
  if (process.platform === "win32" && /^\/[A-Za-z]:/.test(pathname)) {
    pathname = pathname.slice(1);
  }
  return `file:${pathname}`;
}

export function isSqliteDatabaseUrl(connectionString) {
  return typeof connectionString === "string" && connectionString.startsWith("file:");
}
