import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { buildUsersHref } from "@/lib/users-query";
import { isRestrictionActive } from "@/lib/restrictions";
import { Role, SubRole } from "@/generated/prisma";
import { UserRow } from "@/components/users/user-row";
import { UserDetailModal } from "@/components/users/user-detail-modal";
import { RangeSlider } from "@/components/users/range-slider";
import { FiltersPanel } from "@/components/users/filters-panel";
import { SearchInput } from "@/components/users/search-input";

export const metadata: Metadata = {
  title: "Users — Back Office",
};

const PAGE_SIZE = 20;
const LOG_LIMIT = 50;
const NOTE_LIMIT = 100;

const LEVEL_MIN = 1;
const LEVEL_MAX = 100;
const POINTS_MIN = 0;
const POINTS_MAX = 20000;

const ALL_ROLES: string[] = [Role.OWNER, Role.ADMIN, Role.MODERATOR, Role.USER];
const ALL_SUB_ROLES: string[] = [SubRole.TRUSTED, SubRole.COMMENTOR];

const USER_SUMMARY_SELECT = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  subRoles: true,
  banned: true,
  bannedUntil: true,
  blocked: true,
  blockedUntil: true,
  marketBlocked: true,
  marketBlockedUntil: true,
  shopBlocked: true,
  shopBlockedUntil: true,
  points: true,
  level: true,
  xp: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function toRestrictionView(active: boolean, until: Date | null) {
  const effective = isRestrictionActive(active, until);
  return { active: effective, untilLabel: effective && until ? formatDateTime(until) : null };
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function clampInt(value: string | undefined, fallback: number, min: number, max: number) {
  const n = parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export default async function UsersPage(props: PageProps<"/users">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const page = Math.max(1, parseInt(firstParam(searchParams.page) ?? "1", 10) || 1);
  const userIdParam = firstParam(searchParams.userId);
  const showLogs = firstParam(searchParams.logs) === "1";
  const showNotes = firstParam(searchParams.notes) === "1";

  const selectedRoles = toArray(searchParams.role).filter((r) => ALL_ROLES.includes(r));
  const selectedSubRoles = toArray(searchParams.subRole).filter((r) => ALL_SUB_ROLES.includes(r));

  let levelMin = clampInt(firstParam(searchParams.levelMin), LEVEL_MIN, LEVEL_MIN, LEVEL_MAX);
  let levelMax = clampInt(firstParam(searchParams.levelMax), LEVEL_MAX, LEVEL_MIN, LEVEL_MAX);
  if (levelMin > levelMax) [levelMin, levelMax] = [levelMax, levelMin];

  let pointsMin = clampInt(firstParam(searchParams.pointsMin), POINTS_MIN, POINTS_MIN, POINTS_MAX);
  let pointsMax = clampInt(firstParam(searchParams.pointsMax), POINTS_MAX, POINTS_MIN, POINTS_MAX);
  if (pointsMin > pointsMax) [pointsMin, pointsMax] = [pointsMax, pointsMin];

  const isLevelFiltered = levelMin !== LEVEL_MIN || levelMax !== LEVEL_MAX;
  const isPointsFiltered = pointsMin !== POINTS_MIN || pointsMax !== POINTS_MAX;
  const hasActiveFilters =
    selectedRoles.length > 0 || selectedSubRoles.length > 0 || isLevelFiltered || isPointsFiltered;

  const where = {
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(selectedRoles.length > 0 ? { role: { in: selectedRoles as Role[] } } : {}),
    ...(selectedSubRoles.length > 0 ? { subRoles: { hasSome: selectedSubRoles as SubRole[] } } : {}),
    ...(isLevelFiltered ? { level: { gte: levelMin, lte: levelMax } } : {}),
    ...(isPointsFiltered ? { points: { gte: pointsMin, lte: pointsMax } } : {}),
  };

  // Shared with every href below so pagination, row clicks, and the modal all
  // keep the filters that produced the list currently on screen.
  const activeFilters = {
    roles: selectedRoles.length > 0 ? selectedRoles : undefined,
    subRoles: selectedSubRoles.length > 0 ? selectedSubRoles : undefined,
    levelMin: isLevelFiltered ? levelMin : undefined,
    levelMax: isLevelFiltered ? levelMax : undefined,
    pointsMin: isPointsFiltered ? pointsMin : undefined,
    pointsMax: isPointsFiltered ? pointsMax : undefined,
  };

  const [users, total, session, selectedUser, auditLogs, notes] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: USER_SUMMARY_SELECT,
    }),
    prisma.user.count({ where }),
    auth(),
    userIdParam
      ? prisma.user.findUnique({ where: { id: userIdParam }, select: USER_SUMMARY_SELECT })
      : Promise.resolve(null),
    userIdParam && showLogs
      ? prisma.auditLog.findMany({
          where: { targetUserId: userIdParam },
          orderBy: { createdAt: "desc" },
          take: LOG_LIMIT,
        })
      : Promise.resolve(null),
    userIdParam && showNotes
      ? prisma.note.findMany({
          where: { targetUserId: userIdParam },
          orderBy: { createdAt: "desc" },
          take: NOTE_LIMIT,
        })
      : Promise.resolve(null),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectedUserView = (() => {
    if (!selectedUser) return null;
    const ban = toRestrictionView(selectedUser.banned, selectedUser.bannedUntil);
    const block = toRestrictionView(selectedUser.blocked, selectedUser.blockedUntil);
    const market = toRestrictionView(selectedUser.marketBlocked, selectedUser.marketBlockedUntil);
    const shop = toRestrictionView(selectedUser.shopBlocked, selectedUser.shopBlockedUntil);
    return {
      ...selectedUser,
      banned: ban.active,
      bannedUntilLabel: ban.untilLabel,
      blocked: block.active,
      blockedUntilLabel: block.untilLabel,
      marketBlocked: market.active,
      marketBlockedUntilLabel: market.untilLabel,
      shopBlocked: shop.active,
      shopBlockedUntilLabel: shop.untilLabel,
      joinedLabel: formatDate(selectedUser.createdAt),
      lastLoginLabel: selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : "Never",
    };
  })();

  const auditLogEntries = auditLogs?.map((log) => ({
    id: log.id,
    action: log.action,
    details: log.details,
    actorUsername: log.actorUsername,
    whenLabel: formatDateTime(log.createdAt),
  }));

  const noteEntries = notes?.map((note) => ({
    id: note.id,
    body: note.body,
    authorUsername: note.authorUsername,
    whenLabel: formatDateTime(note.createdAt),
  }));

  return (
    <div className="flex flex-col gap-4">
      <form action="/users" method="GET" className="flex flex-col gap-4">
        <div className="flex gap-2">
          <SearchInput defaultValue={q} />
        </div>

        <FiltersPanel hasActiveFilters={hasActiveFilters}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Role</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-1.5 text-sm text-foreground">
                    <input
                      key={`${role}-${selectedRoles.includes(role)}`}
                      type="checkbox"
                      name="role"
                      value={role}
                      defaultChecked={selectedRoles.includes(role)}
                      className="accent-primary"
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Sub-role</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {ALL_SUB_ROLES.map((subRole) => (
                  <label key={subRole} className="flex items-center gap-1.5 text-sm text-foreground">
                    <input
                      key={`${subRole}-${selectedSubRoles.includes(subRole)}`}
                      type="checkbox"
                      name="subRole"
                      value={subRole}
                      defaultChecked={selectedSubRoles.includes(subRole)}
                      className="accent-primary"
                    />
                    {subRole}
                  </label>
                ))}
              </div>
            </div>

            <RangeSlider
              key={`level-${levelMin}-${levelMax}`}
              label="Level"
              name="level"
              min={LEVEL_MIN}
              max={LEVEL_MAX}
              defaultMin={levelMin}
              defaultMax={levelMax}
            />
            <RangeSlider
              key={`points-${pointsMin}-${pointsMax}`}
              label="Points"
              name="points"
              min={POINTS_MIN}
              max={POINTS_MAX}
              defaultMin={pointsMin}
              defaultMax={pointsMax}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Link
              href="/users"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Clear filters
            </Link>
            <button
              type="submit"
              className="btn-neon rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow"
            >
              Apply filters
            </button>
          </div>
        </FiltersPanel>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Level</th>
              <th className="px-4 py-3 font-medium">Points</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last login</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const ban = toRestrictionView(user.banned, user.bannedUntil);
              const block = toRestrictionView(user.blocked, user.blockedUntil);
              const market = toRestrictionView(user.marketBlocked, user.marketBlockedUntil);
              const shop = toRestrictionView(user.shopBlocked, user.shopBlockedUntil);
              return (
                <UserRow
                  key={user.id}
                  user={{
                    ...user,
                    banned: ban.active,
                    blocked: block.active,
                    marketBlocked: market.active,
                    shopBlocked: shop.active,
                    joinedLabel: formatDate(user.createdAt),
                    lastLoginLabel: user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never",
                  }}
                  href={buildUsersHref({ q, page, userId: user.id, ...activeFilters })}
                />
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Page {page} of {totalPages} · {total} user{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={buildUsersHref({ q, page: page - 1, ...activeFilters })}
              className="rounded-md border border-border px-3 py-1.5 transition hover:border-primary hover:text-primary"
            >
              Previous
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={buildUsersHref({ q, page: page + 1, ...activeFilters })}
              className="rounded-md border border-border px-3 py-1.5 transition hover:border-primary hover:text-primary"
            >
              Next
            </Link>
          )}
        </div>
      </div>

      {selectedUserView && session?.user && (
        <UserDetailModal
          user={selectedUserView}
          closeHref={buildUsersHref({ q, page, ...activeFilters })}
          isSelf={selectedUserView.id === session.user.id}
          logsHref={buildUsersHref({ q, page, userId: selectedUserView.id, logs: true, ...activeFilters })}
          logsCloseHref={buildUsersHref({ q, page, userId: selectedUserView.id, ...activeFilters })}
          logs={showLogs ? auditLogEntries ?? [] : null}
          notesHref={buildUsersHref({ q, page, userId: selectedUserView.id, notes: true, ...activeFilters })}
          notesCloseHref={buildUsersHref({ q, page, userId: selectedUserView.id, ...activeFilters })}
          notes={showNotes ? noteEntries ?? [] : null}
        />
      )}
    </div>
  );
}
