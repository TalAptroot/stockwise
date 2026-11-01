import { getDb } from "./db.js";
import { sumPriceQuantity } from "./money.js";

export type LowStockItem = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
};

export type DashboardResponse = {
  productCount: number;
  totalQuantity: number;
  lowStockCount: number;
  inventoryValue: string;
  movementCount: number;
  lowStock: LowStockItem[];
};

export async function getDashboard(): Promise<DashboardResponse> {
  const db = getDb();
  const lowStockWhere = {
    quantity: { lte: db.product.fields.minQuantity },
  };

  const [productCount, quantitySum, lowStockCount, lowStock, movementCount, priced] =
    await Promise.all([
      db.product.count(),
      db.product.aggregate({ _sum: { quantity: true } }),
      db.product.count({ where: lowStockWhere }),
      db.product.findMany({
        where: lowStockWhere,
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          minQuantity: true,
        },
        orderBy: [{ quantity: "asc" }, { name: "asc" }, { id: "asc" }],
      }),
      db.stockMovement.count(),
      db.product.findMany({
        select: { price: true, quantity: true },
      }),
    ]);

  return {
    productCount,
    totalQuantity: quantitySum._sum.quantity ?? 0,
    lowStockCount,
    inventoryValue: sumPriceQuantity(priced),
    movementCount,
    lowStock,
  };
}
