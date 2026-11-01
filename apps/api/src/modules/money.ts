import { ErrorCodes, HttpError } from "./http-error.js";

type DecimalLike = {
  toFixed(fractionDigits: number): string;
};

export function serializeDecimal(value: DecimalLike): string {
  return centsToDecimalString(decimalToCents(value));
}

export function sumPriceQuantity(
  rows: ReadonlyArray<{ price: DecimalLike; quantity: number }>,
): string {
  let cents = 0n;
  for (const row of rows) {
    cents += decimalToCents(row.price) * BigInt(row.quantity);
  }
  return centsToDecimalString(cents);
}

function decimalToCents(value: DecimalLike): bigint {
  const fixed = value.toFixed(2);
  const negative = fixed.startsWith("-");
  const unsigned = negative ? fixed.slice(1) : fixed;
  const [whole, fraction = ""] = unsigned.split(".");
  if (whole === undefined || !/^\d+$/.test(whole) || !/^\d{2}$/.test(fraction)) {
    throw new HttpError(500, ErrorCodes.internal, "Internal server error");
  }
  const cents = BigInt(whole) * 100n + BigInt(fraction);
  return negative ? -cents : cents;
}

function centsToDecimalString(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}
