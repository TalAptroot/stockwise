import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { getDashboard } from "../modules/dashboard.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const dashboard = await getDashboard();
    res.status(200).json(dashboard);
  }),
);
