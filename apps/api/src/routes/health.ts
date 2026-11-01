import { SERVICE_NAME, type HealthStatus } from "@stockwise/shared";
import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const body: HealthStatus = {
    service: SERVICE_NAME,
    status: "ok",
  };

  res.status(200).json(body);
});
