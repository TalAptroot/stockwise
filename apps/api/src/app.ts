import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { loadDatabaseEnv } from "./modules/env.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { healthRouter } from "./routes/health.js";
import { productsRouter } from "./routes/products.js";
import { stockMovementsRouter } from "./routes/stock-movements.js";

// apps/api/src/app.ts -> apps/web/dist. Present after `pnpm build`.
const webDistPath = fileURLToPath(new URL("../../../apps/web/dist", import.meta.url));

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use((_req, _res, next) => {
    loadDatabaseEnv();
    next();
  });
  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/stock-movements", stockMovementsRouter);
  app.use("/api/dashboard", dashboardRouter);
  if (existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
  }
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
