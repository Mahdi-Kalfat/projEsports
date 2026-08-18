export type ItemsFilters = {
  itemId?: string;
};

export function buildItemsHref(params: ItemsFilters) {
  const sp = new URLSearchParams();
  if (params.itemId) sp.set("itemId", params.itemId);
  const qs = sp.toString();
  return `/items${qs ? `?${qs}` : ""}`;
}
