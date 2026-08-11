export type MarketplaceFilters = {
  listingId?: string;
};

export function buildMarketplaceHref(params: MarketplaceFilters) {
  const sp = new URLSearchParams();
  if (params.listingId) sp.set("listingId", params.listingId);
  const qs = sp.toString();
  return `/marketplace${qs ? `?${qs}` : ""}`;
}
