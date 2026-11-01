import type { PrismaClient } from "../generated/prisma/client.js";

type MovementType = "IN" | "OUT";

type SeedMovement = {
  type: MovementType;
  quantity: number;
  at: string;
};

type SeedProduct = {
  name: string;
  sku: string;
  category: string;
  price: string;
  minQuantity: number;
  createdAt: string;
  movements: readonly SeedMovement[];
};

const SEED_PRODUCTS: readonly SeedProduct[] = [
  {
    name: "Oat Milk",
    sku: "BEV-OAT-001",
    category: "Beverages",
    price: "3.49",
    minQuantity: 12,
    createdAt: "2026-10-20T08:00:00.000Z",
    movements: [
      { type: "IN", quantity: 48, at: "2026-10-20T08:05:00.000Z" },
      { type: "OUT", quantity: 6, at: "2026-10-27T15:30:00.000Z" },
    ],
  },
  {
    name: "Espresso Beans",
    sku: "BEV-ESP-002",
    category: "Beverages",
    price: "14.90",
    minQuantity: 8,
    createdAt: "2026-10-20T08:10:00.000Z",
    movements: [
      { type: "IN", quantity: 20, at: "2026-10-20T08:15:00.000Z" },
      { type: "OUT", quantity: 14, at: "2026-10-30T14:00:00.000Z" },
    ],
  },
  {
    name: "Dish Soap",
    sku: "CLN-SOAP-010",
    category: "Cleaning",
    price: "4.25",
    minQuantity: 6,
    createdAt: "2026-10-21T09:00:00.000Z",
    movements: [
      { type: "IN", quantity: 18, at: "2026-10-21T09:05:00.000Z" },
      { type: "OUT", quantity: 4, at: "2026-10-28T11:20:00.000Z" },
    ],
  },
  {
    name: "Glass Cleaner",
    sku: "CLN-GLS-011",
    category: "Cleaning",
    price: "3.80",
    minQuantity: 10,
    createdAt: "2026-10-21T09:10:00.000Z",
    movements: [{ type: "IN", quantity: 10, at: "2026-10-22T10:00:00.000Z" }],
  },
  {
    name: "Cheddar Block",
    sku: "DRY-CHD-020",
    category: "Dairy",
    price: "6.50",
    minQuantity: 4,
    createdAt: "2026-10-22T07:30:00.000Z",
    movements: [
      { type: "IN", quantity: 16, at: "2026-10-22T07:35:00.000Z" },
      { type: "OUT", quantity: 3, at: "2026-10-29T16:10:00.000Z" },
    ],
  },
  {
    name: "Greek Yogurt",
    sku: "DRY-YGT-021",
    category: "Dairy",
    price: "1.25",
    minQuantity: 20,
    createdAt: "2026-10-22T07:40:00.000Z",
    movements: [
      { type: "IN", quantity: 24, at: "2026-10-22T07:45:00.000Z" },
      { type: "OUT", quantity: 10, at: "2026-10-30T09:00:00.000Z" },
    ],
  },
  {
    name: "Brown Rice",
    sku: "PAN-RCE-030",
    category: "Pantry",
    price: "2.40",
    minQuantity: 5,
    createdAt: "2026-10-23T12:00:00.000Z",
    movements: [
      { type: "IN", quantity: 40, at: "2026-10-23T12:05:00.000Z" },
      { type: "OUT", quantity: 8, at: "2026-10-28T18:00:00.000Z" },
    ],
  },
  {
    name: "Penne Pasta",
    sku: "PAN-PEN-031",
    category: "Pantry",
    price: "1.80",
    minQuantity: 8,
    createdAt: "2026-10-23T12:10:00.000Z",
    movements: [
      { type: "IN", quantity: 30, at: "2026-10-23T12:15:00.000Z" },
      { type: "OUT", quantity: 5, at: "2026-10-29T08:40:00.000Z" },
    ],
  },
  {
    name: "Canned Tomatoes",
    sku: "PAN-TOM-032",
    category: "Pantry",
    price: "1.15",
    minQuantity: 12,
    createdAt: "2026-10-23T12:20:00.000Z",
    movements: [
      { type: "IN", quantity: 36, at: "2026-10-23T12:25:00.000Z" },
      { type: "OUT", quantity: 4, at: "2026-10-27T09:15:00.000Z" },
    ],
  },
  {
    name: "Bananas",
    sku: "PRD-BAN-040",
    category: "Produce",
    price: "0.69",
    minQuantity: 15,
    createdAt: "2026-10-24T06:00:00.000Z",
    movements: [
      { type: "IN", quantity: 40, at: "2026-10-24T06:05:00.000Z" },
      { type: "OUT", quantity: 28, at: "2026-10-31T11:00:00.000Z" },
    ],
  },
  {
    name: "Baby Spinach",
    sku: "PRD-SPN-041",
    category: "Produce",
    price: "2.99",
    minQuantity: 6,
    createdAt: "2026-10-24T06:10:00.000Z",
    movements: [
      { type: "IN", quantity: 14, at: "2026-10-24T06:15:00.000Z" },
      { type: "OUT", quantity: 4, at: "2026-10-29T19:45:00.000Z" },
    ],
  },
  {
    name: "Lemons",
    sku: "PRD-LEM-042",
    category: "Produce",
    price: "0.45",
    minQuantity: 10,
    createdAt: "2026-10-24T06:20:00.000Z",
    movements: [
      { type: "IN", quantity: 20, at: "2026-10-24T06:25:00.000Z" },
      { type: "OUT", quantity: 12, at: "2026-10-31T16:00:00.000Z" },
    ],
  },
];

export async function seedDemoInventory(db: PrismaClient): Promise<"seeded" | "skipped"> {
  let existing: number;
  try {
    existing = await db.product.count();
  } catch (error) {
    throw new Error(
      "SQLite demo database has no inventory schema. Start it with pnpm demo so the schema is applied.",
      { cause: error },
    );
  }

  if (existing > 0) {
    return "skipped";
  }

  await db.$transaction(async (tx) => {
    const again = await tx.product.count();
    if (again > 0) {
      return;
    }

    for (const product of SEED_PRODUCTS) {
      const quantity = quantityOnHand(product);
      await tx.product.create({
        data: {
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          quantity,
          minQuantity: product.minQuantity,
          createdAt: new Date(product.createdAt),
          movements: {
            create: product.movements.map((movement) => ({
              type: movement.type,
              quantity: movement.quantity,
              createdAt: new Date(movement.at),
            })),
          },
        },
      });
    }
  });

  return "seeded";
}

function quantityOnHand(product: SeedProduct): number {
  let quantity = 0;
  for (const movement of product.movements) {
    quantity += movement.type === "IN" ? movement.quantity : -movement.quantity;
    if (quantity < 0) {
      throw new Error(`Demo seed for ${product.sku} would make quantity negative`);
    }
  }
  return quantity;
}
