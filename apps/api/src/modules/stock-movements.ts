import { ErrorCodes, HttpError, findHttpError } from "./http-error.js";
import { inspectDbError } from "./db-errors.js";
import { getDb } from "./db.js";
import type { StockMovementWrite } from "./validation.js";

export type StockMovementResponse = {
  id: number;
  productId: number;
  type: "IN" | "OUT";
  quantity: number;
  createdAt: string;
};

type StoredMovement = {
  id: number;
  productId: number;
  type: "IN" | "OUT";
  quantity: number;
  createdAt: Date;
};

export async function listStockMovements(
  productId: number | undefined,
): Promise<StockMovementResponse[]> {
  const movements = await getDb().stockMovement.findMany({
    where: productId === undefined ? undefined : { productId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return movements.map(serializeMovement);
}

export async function createStockMovement(
  input: StockMovementWrite,
): Promise<StockMovementResponse> {
  const db = getDb();
  try {
    return await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: input.productId },
        select: { id: true },
      });
      if (product === null) {
        throw productNotFound();
      }

      if (input.type === "OUT") {
        const updated = await tx.product.updateMany({
          where: {
            id: input.productId,
            quantity: { gte: input.quantity },
          },
          data: {
            quantity: { decrement: input.quantity },
          },
        });
        if (updated.count === 0) {
          throw new HttpError(409, ErrorCodes.insufficientStock, "Insufficient stock");
        }
      } else {
        const updated = await tx.product.updateMany({
          where: {
            id: input.productId,
            quantity: { lte: 2_147_483_647 - input.quantity },
          },
          data: {
            quantity: { increment: input.quantity },
          },
        });
        if (updated.count === 0) {
          const stillThere = await tx.product.findUnique({
            where: { id: input.productId },
            select: { id: true },
          });
          if (stillThere === null) {
            throw productNotFound();
          }
          throw new HttpError(
            409,
            ErrorCodes.quantityLimit,
            "Resulting stock quantity exceeds the allowed maximum",
          );
        }
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: input.productId,
          type: input.type,
          quantity: input.quantity,
        },
      });
      return serializeMovement(movement);
    });
  } catch (error) {
    const httpError = findHttpError(error);
    if (httpError !== undefined) {
      throw httpError;
    }
    const info = inspectDbError(error);
    if (info.prismaCode === "P2025" || info.prismaCode === "P2003" || info.errno === 1452) {
      throw productNotFound();
    }
    if (info.prismaCode === "P2020" || info.errno === 1264 || info.errno === 1690) {
      throw new HttpError(
        409,
        ErrorCodes.quantityLimit,
        "Resulting stock quantity exceeds the allowed maximum",
      );
    }
    throw error;
  }
}

function serializeMovement(movement: StoredMovement): StockMovementResponse {
  return {
    id: movement.id,
    productId: movement.productId,
    type: movement.type,
    quantity: movement.quantity,
    createdAt: movement.createdAt.toISOString(),
  };
}

function productNotFound(): HttpError {
  return new HttpError(404, ErrorCodes.notFound, "Product not found");
}
