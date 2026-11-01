import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { rejectInvalid } from "../modules/http-error.js";
import { createStockMovement, listStockMovements } from "../modules/stock-movements.js";
import { parseMovementListQuery, parseStockMovement } from "../modules/validation.js";

export const stockMovementsRouter = Router();

stockMovementsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const productId = rejectInvalid(parseMovementListQuery(req.query));
    const movements = await listStockMovements(productId);
    res.status(200).json(movements);
  }),
);

stockMovementsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = rejectInvalid(parseStockMovement(req.body));
    const movement = await createStockMovement(input);
    res.status(201).json(movement);
  }),
);
