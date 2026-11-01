import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { loadDatabaseEnv } from "./modules/env.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { healthRouter } from "./routes/health.js";
import { productsRouter } from "./routes/products.js";
import { stockMovementsRouter } from "./routes/stock-movements.js";

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
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
