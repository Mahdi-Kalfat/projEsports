export type EventsFilters = {
  eventId?: string;
};

export function buildEventsHref(params: EventsFilters) {
  const sp = new URLSearchParams();
  if (params.eventId) sp.set("eventId", params.eventId);
  const qs = sp.toString();
  return `/events${qs ? `?${qs}` : ""}`;
}
