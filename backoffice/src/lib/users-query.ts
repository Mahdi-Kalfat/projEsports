export type UsersFilters = {
  q?: string;
  page?: number;
  userId?: string;
  logs?: boolean;
  notes?: boolean;
  roles?: string[];
  subRoles?: string[];
  levelMin?: number;
  levelMax?: number;
  pointsMin?: number;
  pointsMax?: number;
};

export function buildUsersHref(params: UsersFilters) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.userId) sp.set("userId", params.userId);
  if (params.logs) sp.set("logs", "1");
  if (params.notes) sp.set("notes", "1");
  for (const role of params.roles ?? []) sp.append("role", role);
  for (const subRole of params.subRoles ?? []) sp.append("subRole", subRole);
  if (params.levelMin !== undefined) sp.set("levelMin", String(params.levelMin));
  if (params.levelMax !== undefined) sp.set("levelMax", String(params.levelMax));
  if (params.pointsMin !== undefined) sp.set("pointsMin", String(params.pointsMin));
  if (params.pointsMax !== undefined) sp.set("pointsMax", String(params.pointsMax));
  const qs = sp.toString();
  return `/users${qs ? `?${qs}` : ""}`;
}
