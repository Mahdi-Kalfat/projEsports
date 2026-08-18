// Mirror of frontoffice's lib/format.ts (only the pure formatters this bot
// actually needs) — kept in sync manually, same as the other mirrored lib
// files in this bot.
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  return `${formatCompactNumber(value)} DT`;
}

export function formatPriceByType(priceType: string, price: number): string {
  if (priceType === "FREE" || price <= 0) return "Free";
  if (priceType === "MONEY") return formatCompactCurrency(price);
  if (priceType === "CC") return `${formatCompactNumber(price)} cc`;
  return `${formatCompactNumber(price)} pts`;
}
