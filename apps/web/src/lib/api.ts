import type { ProductCreateBody, ProductUpdateBody, StockMovementBody } from "./validation.ts";

export type Product = {
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

export type StockMovement = {
  id: number;
  productId: number;
  type: "IN" | "OUT";
  quantity: number;
  createdAt: string;
};

export type LowStockItem = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
};

export type Dashboard = {
  productCount: number;
  totalQuantity: number;
  lowStockCount: number;
  inventoryValue: string;
  movementCount: number;
  lowStock: LowStockItem[];
};

type RequestOptions = {
  signal?: AbortSignal;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function listProducts(q?: string, options?: RequestOptions): Promise<Product[]> {
  const params = new URLSearchParams();
  const trimmed = q?.trim() ?? "";
  if (trimmed.length > 0) {
    params.set("q", trimmed);
  }
  const query = params.toString();
  const path = query.length > 0 ? `/api/products?${query}` : "/api/products";
  return apiRequest(path, { signal: options?.signal }).then((data) =>
    asArray<Product>(data, "product list"),
  );
}

export function createProduct(body: ProductCreateBody): Promise<Product> {
  return apiRequest("/api/products", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((data) => data as Product);
}

export function updateProduct(id: number, body: ProductUpdateBody): Promise<Product> {
  return apiRequest(`/api/products/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify(body),
  }).then((data) => data as Product);
}

export function deleteProduct(id: number): Promise<void> {
  return apiRequest(`/api/products/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  }).then(() => undefined);
}

export function listMovements(options?: RequestOptions & { productId?: number }): Promise<StockMovement[]> {
  const params = new URLSearchParams();
  if (options?.productId !== undefined) {
    params.set("productId", String(options.productId));
  }
  const query = params.toString();
  const path = query.length > 0 ? `/api/stock-movements?${query}` : "/api/stock-movements";
  return apiRequest(path, { signal: options?.signal }).then((data) =>
    asArray<StockMovement>(data, "stock movement list"),
  );
}

export function createMovement(body: StockMovementBody): Promise<StockMovement> {
  return apiRequest("/api/stock-movements", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((data) => data as StockMovement);
}

export function getDashboard(options?: RequestOptions): Promise<Dashboard> {
  return apiRequest("/api/dashboard", { signal: options?.signal }).then((data) => {
    if (!isDashboard(data)) {
      throw new ApiError(200, "INVALID_RESPONSE", "Unexpected dashboard response.");
    }
    return data;
  });
}

async function apiRequest(path: string, init?: RequestInit): Promise<unknown> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new ApiError(0, "NETWORK", "Unable to reach the server. Check that the API is running.");
  }

  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const parsed = readError(payload);
    throw new ApiError(
      response.status,
      parsed?.code ?? "REQUEST_FAILED",
      parsed?.message ?? `Request failed (${response.status}).`,
    );
  }

  if (payload === null) {
    throw new ApiError(response.status, "INVALID_RESPONSE", "The server returned an unreadable response.");
  }

  return payload;
}

function readError(payload: unknown): { code: string; message: string } | undefined {
  if (typeof payload !== "object" || payload === null || !("error" in payload)) {
    return undefined;
  }
  const error = payload.error;
  if (typeof error !== "object" || error === null || !("message" in error) || typeof error.message !== "string") {
    return undefined;
  }
  if (error.message.trim().length === 0) {
    return undefined;
  }
  const code = "code" in error && typeof error.code === "string" ? error.code : "REQUEST_FAILED";
  return { code, message: error.message };
}

function asArray<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new ApiError(200, "INVALID_RESPONSE", `Unexpected ${label} response.`);
  }
  return value as T[];
}

function isDashboard(value: unknown): value is Dashboard {
  return typeof value === "object" && value !== null && "lowStock" in value && Array.isArray(value.lowStock);
}
