export type ShopFilters = {
  itemId?: string;
};

export function buildShopHref(params: ShopFilters) {
  const sp = new URLSearchParams();
  if (params.itemId) sp.set("itemId", params.itemId);
  const qs = sp.toString();
  return `/shop${qs ? `?${qs}` : ""}`;
}
