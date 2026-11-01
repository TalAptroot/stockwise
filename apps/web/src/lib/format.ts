const countFormat = new Intl.NumberFormat("en");
const dateTimeFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatCount(value: number): string {
  return countFormat.format(value);
}

export function formatDecimal(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return value;
  }
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholeRaw, fraction] = unsigned.split(".");
  const whole = wholeRaw ?? "0";
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = fraction !== undefined ? `${grouped}.${fraction}` : grouped;
  return negative ? `-${body}` : body;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateTimeFormat.format(date);
}

export function productLabel(name: string | undefined, productId: number): string {
  if (name === undefined || name.trim().length === 0) {
    return `Product #${productId}`;
  }
  return name;
}
