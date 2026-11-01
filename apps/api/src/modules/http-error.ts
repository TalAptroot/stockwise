export const ErrorCodes = {
  validation: "VALIDATION_ERROR",
  notFound: "NOT_FOUND",
  duplicateSku: "DUPLICATE_SKU",
  insufficientStock: "INSUFFICIENT_STOCK",
  productHasMovements: "PRODUCT_HAS_MOVEMENTS",
  quantityLimit: "QUANTITY_LIMIT",
  internal: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;

  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export type ErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

export function errorBody(code: ErrorCode, message: string): ErrorBody {
  return { error: { code, message } };
}

export function rejectInvalid<T>(
  result: { ok: true; value: T } | { ok: false; message: string },
): T {
  if (!result.ok) {
    throw new HttpError(400, ErrorCodes.validation, result.message);
  }
  return result.value;
}

export function findHttpError(error: unknown): HttpError | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 6; depth += 1) {
    if (current instanceof HttpError) {
      return current;
    }
    if (typeof current !== "object" || current === null || !("cause" in current)) {
      return undefined;
    }
    current = current.cause;
  }
  return undefined;
}
