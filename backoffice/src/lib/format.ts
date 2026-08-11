export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  return `${formatCompactNumber(value)} DT`;
}

export function formatSignedPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatPriceByType(priceType: string, price: number): string {
  if (priceType === "FREE" || price <= 0) return "Free";
  if (priceType === "MONEY") return formatCompactCurrency(price);
  return `${formatCompactNumber(price)} pts`;
}
