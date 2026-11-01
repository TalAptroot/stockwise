const MAX_INT = 2_147_483_647;
const MAX_TEXT = 191;
const PRICE_PATTERN = /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/;
const POSITIVE_ID_PATTERN = /^[1-9]\d*$/;

const CREATE_FIELDS = new Set(["name", "sku", "category", "price", "quantity", "minQuantity"]);
const UPDATE_FIELDS = new Set(["name", "sku", "category", "price", "minQuantity"]);

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

export type ProductWrite = {
  name: string;
  sku: string;
  category: string;
  price: string;
  quantity: number;
  minQuantity: number;
};

export type ProductUpdate = {
  name?: string;
  sku?: string;
  category?: string;
  price?: string;
  minQuantity?: number;
};

export type StockMovementWrite = {
  productId: number;
  type: "IN" | "OUT";
  quantity: number;
};

export function parseProductSearch(query: unknown): ValidationResult<string | undefined> {
  const record = asQueryRecord(query);
  if (!record.ok) {
    return record;
  }
  if (!Object.hasOwn(record.value, "q")) {
    return ok(undefined);
  }
  const q = record.value["q"];
  if (typeof q !== "string") {
    return fail("q must be a string");
  }
  const trimmed = q.trim();
  if (trimmed.length === 0) {
    return ok(undefined);
  }
  if (trimmed.length > MAX_TEXT) {
    return fail("q must be at most 191 characters");
  }
  if (trimmed.includes("\u0000")) {
    return fail("q contains an invalid character");
  }
  return ok(trimmed);
}

export function parseMovementListQuery(query: unknown): ValidationResult<number | undefined> {
  const record = asQueryRecord(query);
  if (!record.ok) {
    return record;
  }
  if (!Object.hasOwn(record.value, "productId")) {
    return ok(undefined);
  }
  const productId = record.value["productId"];
  if (typeof productId !== "string") {
    return fail("productId must be a positive integer");
  }
  const parsed = parseIdString(productId);
  if (parsed === undefined) {
    return fail("productId must be a positive integer");
  }
  return ok(parsed);
}

export function parseRouteId(value: unknown): ValidationResult<number> {
  if (typeof value !== "string") {
    return fail("id must be a positive integer");
  }
  const parsed = parseIdString(value);
  if (parsed === undefined) {
    return fail("id must be a positive integer");
  }
  return ok(parsed);
}

export function parseCreateProduct(body: unknown): ValidationResult<ProductWrite> {
  const record = asBody(body);
  if (!record.ok) {
    return record;
  }
  const unexpected = unexpectedField(record.value, CREATE_FIELDS);
  if (unexpected !== undefined) {
    return fail(`Unexpected field: ${unexpected}`);
  }

  const name = requireText(record.value, "name", true);
  if (!name.ok) return name;
  const sku = requireText(record.value, "sku", true);
  if (!sku.ok) return sku;
  const category = requireText(record.value, "category", true);
  if (!category.ok) return category;
  const price = requirePrice(record.value, true);
  if (!price.ok) return price;

  const quantity = readInt(record.value, "quantity", 0, MAX_INT, 0);
  if (!quantity.ok) return quantity;
  const minQuantity = readInt(record.value, "minQuantity", 0, MAX_INT, 0);
  if (!minQuantity.ok) return minQuantity;

  return ok({
    name: name.value,
    sku: sku.value,
    category: category.value,
    price: price.value,
    quantity: quantity.value,
    minQuantity: minQuantity.value,
  });
}

export function parseUpdateProduct(body: unknown): ValidationResult<ProductUpdate> {
  const record = asBody(body);
  if (!record.ok) {
    return record;
  }
  if (Object.hasOwn(record.value, "quantity")) {
    return fail("quantity cannot be updated on a product; record a stock movement instead");
  }
  const unexpected = unexpectedField(record.value, UPDATE_FIELDS);
  if (unexpected !== undefined) {
    return fail(`Unexpected field: ${unexpected}`);
  }

  const update: ProductUpdate = {};
  if (Object.hasOwn(record.value, "name")) {
    const name = requireText(record.value, "name", true);
    if (!name.ok) return name;
    update.name = name.value;
  }
  if (Object.hasOwn(record.value, "sku")) {
    const sku = requireText(record.value, "sku", true);
    if (!sku.ok) return sku;
    update.sku = sku.value;
  }
  if (Object.hasOwn(record.value, "category")) {
    const category = requireText(record.value, "category", true);
    if (!category.ok) return category;
    update.category = category.value;
  }
  if (Object.hasOwn(record.value, "price")) {
    const price = requirePrice(record.value, true);
    if (!price.ok) return price;
    update.price = price.value;
  }
  if (Object.hasOwn(record.value, "minQuantity")) {
    const minQuantity = readInt(record.value, "minQuantity", 0, MAX_INT, undefined);
    if (!minQuantity.ok) return minQuantity;
    update.minQuantity = minQuantity.value;
  }

  if (
    update.name === undefined &&
    update.sku === undefined &&
    update.category === undefined &&
    update.price === undefined &&
    update.minQuantity === undefined
  ) {
    return fail("At least one of name, sku, category, price, or minQuantity is required");
  }

  return ok(update);
}

export function parseStockMovement(body: unknown): ValidationResult<StockMovementWrite> {
  const record = asBody(body);
  if (!record.ok) {
    return record;
  }
  const allowed = new Set(["productId", "type", "quantity"]);
  const unexpected = unexpectedField(record.value, allowed);
  if (unexpected !== undefined) {
    return fail(`Unexpected field: ${unexpected}`);
  }

  if (!Object.hasOwn(record.value, "productId")) {
    return fail("productId is required");
  }
  const productId = parseBoundedInt(record.value["productId"], 1, MAX_INT);
  if (productId === undefined) {
    return fail("productId must be a positive integer");
  }

  if (!Object.hasOwn(record.value, "type")) {
    return fail("type is required");
  }
  const type = record.value["type"];
  if (type !== "IN" && type !== "OUT") {
    return fail("type must be IN or OUT");
  }

  if (!Object.hasOwn(record.value, "quantity")) {
    return fail("quantity is required");
  }
  const quantity = parseBoundedInt(record.value["quantity"], 1, MAX_INT);
  if (quantity === undefined) {
    return fail("quantity must be an integer from 1 to 2147483647");
  }

  return ok({ productId, type, quantity });
}

function parseIdString(value: string): number | undefined {
  if (!POSITIVE_ID_PATTERN.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_INT) {
    return undefined;
  }
  return parsed;
}

function asQueryRecord(query: unknown): ValidationResult<Record<string, unknown>> {
  if (typeof query !== "object" || query === null || Array.isArray(query)) {
    return fail("Invalid query");
  }
  return ok(query as Record<string, unknown>);
}

function asBody(body: unknown): ValidationResult<Record<string, unknown>> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail("Request body must be a JSON object");
  }
  return ok(body as Record<string, unknown>);
}

function unexpectedField(body: Record<string, unknown>, allowed: ReadonlySet<string>): string | undefined {
  const unexpected = Object.keys(body)
    .filter((key) => !allowed.has(key))
    .sort();
  return unexpected[0];
}

function requireText(
  body: Record<string, unknown>,
  field: string,
  required: boolean,
): ValidationResult<string> {
  if (!Object.hasOwn(body, field)) {
    return required ? fail(`${field} is required`) : ok("");
  }
  const value = body[field];
  if (typeof value !== "string") {
    return fail(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return fail(`${field} is required`);
  }
  if (trimmed.length > MAX_TEXT) {
    return fail(`${field} must be at most 191 characters`);
  }
  if (trimmed.includes("\u0000")) {
    return fail(`${field} contains an invalid character`);
  }
  return ok(trimmed);
}

function requirePrice(body: Record<string, unknown>, required: boolean): ValidationResult<string> {
  if (!Object.hasOwn(body, "price")) {
    return required ? fail("price is required") : ok("0.00");
  }
  const value = body["price"];
  let text: string;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      return fail("price must be a non-negative amount with at most 2 decimal places");
    }
    text = Object.is(value, -0) ? "0" : value.toString();
    if (text.includes("e") || text.includes("E")) {
      return fail("price must be a non-negative amount with at most 2 decimal places");
    }
  } else if (typeof value === "string") {
    text = value.trim();
  } else {
    return fail("price must be a number or numeric string");
  }

  if (!PRICE_PATTERN.test(text)) {
    return fail(
      "price must be a non-negative amount with at most 2 decimal places and at most 8 digits before the decimal point",
    );
  }
  const [whole, fraction = ""] = text.split(".");
  return ok(`${whole}.${fraction.padEnd(2, "0")}`);
}

function readInt(
  body: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
  fallback: number,
): ValidationResult<number>;
function readInt(
  body: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
  fallback: undefined,
): ValidationResult<number>;
function readInt(
  body: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
  fallback: number | undefined,
): ValidationResult<number> {
  if (!Object.hasOwn(body, field)) {
    if (fallback === undefined) {
      return fail(`${field} must be an integer from ${min} to ${max}`);
    }
    return ok(fallback);
  }
  const parsed = parseBoundedInt(body[field], min, max);
  if (parsed === undefined) {
    return fail(`${field} must be an integer from ${min} to ${max}`);
  }
  return ok(parsed);
}

function parseBoundedInt(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    return undefined;
  }
  return value;
}

function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function fail(message: string): ValidationResult<never> {
  return { ok: false, message };
}
