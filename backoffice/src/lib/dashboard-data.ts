import { prisma } from "@/lib/prisma";
import { TournamentStatus } from "@/generated/prisma";

export type SeriesPoint = { label: string; value: number };
export type GameSlice = { label: string; value: number };

export type DashboardData = {
  kpis: {
    activeUsers: { value: number; deltaPct: number; sparkline: number[] };
    liveTournaments: { value: number };
    signupsToday: { value: number; deltaPct: number; sparkline: number[] };
    revenueMtd: { value: number; deltaPct: number };
  };
  dauMau: number;
  signups14d: SeriesPoint[];
  topGames: GameSlice[];
};

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

async function getDailySignupCounts(days: number) {
  const windowStart = startOfDay(new Date());
  windowStart.setDate(windowStart.getDate() - (days - 1));

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: windowStart } },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const user of users) {
    const key = dateKey(user.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(windowStart);
    date.setDate(date.getDate() + i);
    return { date, count: counts.get(dateKey(date)) ?? 0 };
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const today = startOfDay(now);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const daysElapsedThisMonth = today.getDate();
  const prevMonthSamePoint = new Date(startOfPrevMonth);
  prevMonthSamePoint.setDate(prevMonthSamePoint.getDate() + daysElapsedThisMonth);

  const [
    daily14,
    totalUsersNow,
    totalUsers30dAgo,
    liveTournaments,
    revenueMtd,
    revenuePrevMonthSamePoint,
    dau,
    mau,
    tournamentsWithGame,
  ] = await Promise.all([
    getDailySignupCounts(14),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { lte: thirtyDaysAgo } } }),
    prisma.tournament.count({ where: { status: TournamentStatus.LIVE } }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: startOfPrevMonth, lt: prevMonthSamePoint } },
    }),
    prisma.user.count({ where: { lastLoginAt: { gte: today } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
    prisma.tournament.findMany({ include: { game: true, _count: { select: { participants: true } } } }),
  ]);

  const signups14d: SeriesPoint[] = daily14.map(({ date, count }) => ({
    label: dayLabel(date),
    value: count,
  }));

  const signupsToday = daily14[daily14.length - 1].count;
  const signupsYesterday = daily14[daily14.length - 2]?.count ?? 0;

  // Cumulative registered-user growth, as a stand-in for an "active users" trend —
  // there's no login-history table yet, only the most recent lastLoginAt per user.
  const usersBeforeWindow = totalUsersNow - daily14.reduce((sum, d) => sum + d.count, 0);
  let running = usersBeforeWindow;
  const activeUsersSparkline = daily14.slice(-12).map((d) => {
    running += d.count;
    return running;
  });

  const gameTotals = new Map<string, number>();
  for (const t of tournamentsWithGame) {
    gameTotals.set(t.game.name, (gameTotals.get(t.game.name) ?? 0) + t._count.participants);
  }
  const topGames: GameSlice[] = Array.from(gameTotals.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return {
    kpis: {
      activeUsers: {
        value: totalUsersNow,
        deltaPct: pctChange(totalUsersNow, totalUsers30dAgo),
        sparkline: activeUsersSparkline,
      },
      liveTournaments: { value: liveTournaments },
      signupsToday: {
        value: signupsToday,
        deltaPct: pctChange(signupsToday, signupsYesterday),
        sparkline: daily14.slice(-7).map((d) => d.count),
      },
      revenueMtd: {
        value: revenueMtd._sum.amount ?? 0,
        deltaPct: pctChange(revenueMtd._sum.amount ?? 0, revenuePrevMonthSamePoint._sum.amount ?? 0),
      },
    },
    dauMau: mau > 0 ? dau / mau : 0,
    signups14d,
    topGames,
  };
}
