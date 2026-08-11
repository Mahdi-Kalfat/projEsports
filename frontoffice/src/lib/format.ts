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

// lastLoginAt only updates at sign-in (see auth.ts), not on every page view, so
// this is honest "last seen" rather than true live presence — "Online now" is a
// short window right after login, not a continuously-tracked session.
export function formatLastSeen(lastLoginAt: Date | null): string {
  if (!lastLoginAt) return "Never logged in";
  const diffMs = Date.now() - lastLoginAt.getTime();
  if (diffMs < 2 * 60 * 1000) return "Online now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `Online ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Online ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Last online ${days}d ago`;
  return `Last online ${lastLoginAt.toLocaleDateString("en-US", { dateStyle: "medium" })}`;
}

export function isRecentlyOnline(lastLoginAt: Date | null): boolean {
  if (!lastLoginAt) return false;
  return Date.now() - lastLoginAt.getTime() < 2 * 60 * 1000;
}
