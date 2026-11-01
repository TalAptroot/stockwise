export const MAX_INT = 2_147_483_647;

const MAX_TEXT = 191;
const PRICE_PATTERN = /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/;

export type ProductFormErrors = Partial<
  Record<"name" | "sku" | "category" | "price" | "quantity" | "minQuantity", string>
>;

export type MovementFormErrors = Partial<Record<"productId" | "type" | "quantity", string>>;

export type ProductCreateBody = {
  name: string;
  sku: string;
  category: string;
  price: string;
  quantity?: number;
  minQuantity?: number;
};

export type ProductUpdateBody = {
  name: string;
  sku: string;
  category: string;
  price: string;
  minQuantity: number;
};

export type StockMovementBody = {
  productId: number;
  type: "IN" | "OUT";
  quantity: number;
};

type ProductFormValues = {
  name: string;
  sku: string;
  category: string;
  price: string;
  quantity: string;
  minQuantity: string;
};

type ProductEditValues = {
  name: string;
  sku: string;
  category: string;
  price: string;
  minQuantity: string;
};

type MovementFormValues = {
  productId: string;
  type: string;
  quantity: string;
};

export function parseIntegerInRange(value: string, min: number, max: number): number | undefined {
  if (!/^(?:0|[1-9]\d*)$/.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    return undefined;
  }
  return parsed;
}

export function validateProductCreate(
  values: ProductFormValues,
): { ok: true; value: ProductCreateBody } | { ok: false; errors: ProductFormErrors } {
  const errors: ProductFormErrors = {};
  const name = readText(values.name, "Name", "name", errors);
  const sku = readText(values.sku, "SKU", "sku", errors);
  const category = readText(values.category, "Category", "category", errors);
  const price = readPrice(values.price, errors);
  const quantity = readOptionalInt(values.quantity, "Quantity", "quantity", errors);
  const minQuantity = readOptionalInt(values.minQuantity, "Minimum quantity", "minQuantity", errors);

  if (
    name === undefined ||
    sku === undefined ||
    category === undefined ||
    price === undefined ||
    !quantity.ok ||
    !minQuantity.ok
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      sku,
      category,
      price,
      ...(quantity.value !== undefined ? { quantity: quantity.value } : {}),
      ...(minQuantity.value !== undefined ? { minQuantity: minQuantity.value } : {}),
    },
  };
}

export function validateProductUpdate(
  values: ProductEditValues,
): { ok: true; value: ProductUpdateBody } | { ok: false; errors: ProductFormErrors } {
  const errors: ProductFormErrors = {};
  const name = readText(values.name, "Name", "name", errors);
  const sku = readText(values.sku, "SKU", "sku", errors);
  const category = readText(values.category, "Category", "category", errors);
  const price = readPrice(values.price, errors);
  const minQuantity = readRequiredInt(values.minQuantity, "Minimum quantity", "minQuantity", errors);

  if (
    name === undefined ||
    sku === undefined ||
    category === undefined ||
    price === undefined ||
    minQuantity === undefined
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { name, sku, category, price, minQuantity },
  };
}

export function validateMovement(
  values: MovementFormValues,
): { ok: true; value: StockMovementBody } | { ok: false; errors: MovementFormErrors } {
  const errors: MovementFormErrors = {};
  const productId = parseIntegerInRange(values.productId.trim(), 1, MAX_INT);
  if (productId === undefined) {
    errors.productId = "Select a product.";
  }

  const type = values.type === "IN" || values.type === "OUT" ? values.type : undefined;
  if (type === undefined) {
    errors.type = "Choose stock in or stock out.";
  }

  const quantity = parseIntegerInRange(values.quantity.trim(), 1, MAX_INT);
  if (quantity === undefined) {
    errors.quantity = "Enter a whole number from 1 to 2147483647.";
  }

  if (productId === undefined || type === undefined || quantity === undefined) {
    return { ok: false, errors };
  }

  return { ok: true, value: { productId, type, quantity } };
}

function readText(
  value: string,
  label: string,
  field: "name" | "sku" | "category",
  errors: ProductFormErrors,
): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    errors[field] = `${label} is required.`;
    return undefined;
  }
  if (trimmed.length > MAX_TEXT) {
    errors[field] = `${label} must be at most 191 characters.`;
    return undefined;
  }
  if (trimmed.includes("\u0000")) {
    errors[field] = `${label} contains an invalid character.`;
    return undefined;
  }
  return trimmed;
}

function readPrice(value: string, errors: ProductFormErrors): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    errors.price = "Price is required.";
    return undefined;
  }
  if (!PRICE_PATTERN.test(trimmed)) {
    errors.price =
      "Enter a non-negative price with at most 8 digits and 2 decimal places.";
    return undefined;
  }
  return trimmed;
}

function readOptionalInt(
  value: string,
  label: string,
  field: "quantity" | "minQuantity",
  errors: ProductFormErrors,
): { ok: true; value: number | undefined } | { ok: false } {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: undefined };
  }
  const parsed = parseIntegerInRange(trimmed, 0, MAX_INT);
  if (parsed === undefined) {
    errors[field] = `${label} must be a whole number from 0 to 2147483647.`;
    return { ok: false };
  }
  return { ok: true, value: parsed };
}

function readRequiredInt(
  value: string,
  label: string,
  field: "minQuantity",
  errors: ProductFormErrors,
): number | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    errors[field] = `${label} is required.`;
    return undefined;
  }
  const parsed = parseIntegerInRange(trimmed, 0, MAX_INT);
  if (parsed === undefined) {
    errors[field] = `${label} must be a whole number from 0 to 2147483647.`;
    return undefined;
  }
  return parsed;
}
