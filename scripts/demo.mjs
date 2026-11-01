import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { demoDatabaseFile, demoDatabaseUrl } from "../packages/db/demo-database.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd: root,
      env: process.env,
      stdio: "inherit",
      shell: true,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`pnpm ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

await run(["db:generate"]);
await run(["--filter", "@stockwise/db", "migrate:demo"]);

const apiPort = "3010";
const webPort = "5180";
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const databaseUrl = demoDatabaseUrl();
const databaseFile = demoDatabaseFile();
console.log("");
console.log("StockWise SQLite demo");
console.log(`Database  ${databaseFile}`);
console.log(`UI        http://localhost:${webPort}`);
console.log(`API       ${apiOrigin}`);
console.log("");

const apiEnv = { ...process.env, DATABASE_URL: databaseUrl, PORT: apiPort };
const webEnv = {
  ...process.env,
  STOCKWISE_API_ORIGIN: apiOrigin,
  STOCKWISE_WEB_PORT: webPort,
};
const children = [
  spawn("pnpm", ["dev:api"], { cwd: root, env: apiEnv, stdio: "inherit", shell: true }),
  spawn("pnpm", ["dev:web"], { cwd: root, env: webEnv, stdio: "inherit", shell: true }),
];

let stopping = false;

function shutdown(exitCode) {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const child of children) {
    if (child.pid !== undefined) {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        shell: true,
        stdio: "ignore",
      });
    }
  }
  setTimeout(() => {
    process.exit(exitCode);
  }, 300);
}

for (const child of children) {
  child.on("exit", (code) => {
    shutdown(code ?? 1);
  });
}

process.on("SIGINT", () => {
  shutdown(0);
});
process.on("SIGTERM", () => {
  shutdown(0);
});
