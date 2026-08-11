export type TournamentsFilters = {
  tournamentId?: string;
};

export function buildTournamentsHref(params: TournamentsFilters) {
  const sp = new URLSearchParams();
  if (params.tournamentId) sp.set("tournamentId", params.tournamentId);
  const qs = sp.toString();
  return `/tournaments${qs ? `?${qs}` : ""}`;
}
