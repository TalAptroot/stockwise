import { inspectDbError } from "./db-errors.js";
import { getDb } from "./db.js";
import { ErrorCodes, HttpError, findHttpError } from "./http-error.js";
import { serializeDecimal } from "./money.js";
import type { ProductUpdate, ProductWrite } from "./validation.js";

export type ProductResponse = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: string;
  quantity: number;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
};

type StoredProduct = {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: { toFixed(fractionDigits: number): string };
  quantity: number;
  minQuantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function listProducts(query: string | undefined): Promise<ProductResponse[]> {
  const products = await getDb().product.findMany({
    where:
      query === undefined
        ? undefined
        : {
            OR: [{ name: { contains: query } }, { sku: { contains: query } }],
          },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  return products.map(serializeProduct);
}

export async function getProduct(id: number): Promise<ProductResponse> {
  const product = await getDb().product.findUnique({ where: { id } });
  if (product === null) {
    throw productNotFound();
  }
  return serializeProduct(product);
}

export async function createProduct(input: ProductWrite): Promise<ProductResponse> {
  try {
    const product = await getDb().product.create({
      data: {
        name: input.name,
        sku: input.sku,
        category: input.category,
        price: input.price,
        quantity: input.quantity,
        minQuantity: input.minQuantity,
      },
    });
    return serializeProduct(product);
  } catch (error) {
    rethrowProductWriteError(error);
  }
}

export async function updateProduct(id: number, input: ProductUpdate): Promise<ProductResponse> {
  try {
    const product = await getDb().product.update({
      where: { id },
      data: {
        name: input.name,
        sku: input.sku,
        category: input.category,
        price: input.price,
        minQuantity: input.minQuantity,
      },
    });
    return serializeProduct(product);
  } catch (error) {
    rethrowProductWriteError(error);
  }
}

export async function deleteProduct(id: number): Promise<void> {
  try {
    await getDb().product.delete({ where: { id } });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    const info = inspectDbError(error);
    if (info.prismaCode === "P2025") {
      throw productNotFound();
    }
    if (info.prismaCode === "P2003" || info.prismaCode === "P2014" || info.errno === 1451) {
      throw new HttpError(
        409,
        ErrorCodes.productHasMovements,
        "Product cannot be deleted because it has stock movements",
      );
    }
    throw error;
  }
}

function serializeProduct(product: StoredProduct): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: serializeDecimal(product.price),
    quantity: product.quantity,
    minQuantity: product.minQuantity,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function productNotFound(): HttpError {
  return new HttpError(404, ErrorCodes.notFound, "Product not found");
}

function rethrowProductWriteError(error: unknown): never {
  const httpError = findHttpError(error);
  if (httpError !== undefined) {
    throw httpError;
  }
  const info = inspectDbError(error);
  if (info.prismaCode === "P2025") {
    throw productNotFound();
  }
  if (info.prismaCode === "P2002" || info.errno === 1062) {
    throw new HttpError(409, ErrorCodes.duplicateSku, "A product with this sku already exists");
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
