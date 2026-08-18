import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactCurrency } from "@/lib/format";
import { registeredCount, formatCapacityLabel } from "@/lib/tournament-capacity";
import { getRequiredXp } from "@/lib/level-xp";
import { utcDayDiff } from "@/lib/daily-cycle";
import { countPendingReceived } from "@/lib/friends";
import { countUnreadMessages } from "@/lib/messages";
import { getNavItemConfigs } from "@/lib/nav-items";
import { HeroCarousel } from "@/components/landing/hero-carousel";
import { GameShowcase } from "@/components/landing/game-showcase";
import { Reveal } from "@/components/ui/reveal";
import { Footer } from "@/components/nav/footer";
import { Navbar } from "@/components/nav/navbar";
import { AmbientBackground } from "@/components/ui/ambient-background";
import { ScoreboardPanel, type NextMatch } from "@/components/home/scoreboard-panel";
import { RewardStatusCard } from "@/components/home/reward-status-card";
import { MyMatches, type MatchRow } from "@/components/home/my-matches";
import { ArrowRight, Trophy, Gift, Dices } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  REGISTRATION: "Registration open",
  CHECK_IN: "Check-in",
  LIVE: "Live",
};

const STATUS_TONE: Record<string, string> = {
  REGISTRATION: "bg-accent/15 text-accent",
  CHECK_IN: "bg-warning/15 text-warning",
  LIVE: "bg-success/15 text-success",
};

function formatWhen(date: Date, status: string) {
  if (status === "LIVE") return "Live now";
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

// Logged-out visitors get the marketing landing (unchanged except a tightened
// hero-to-content gap — see design plan §13). Logged-in players get a real
// dashboard home instead of the identical pitch: their own scoreboard, active
// registrations, and daily-reward/wheel state, all queried live — nothing here
// is placeholder data, an empty section means that's genuinely the player's
// current state.
export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    const [highlightTournaments, navConfigs] = await Promise.all([
      prisma.tournament.findMany({
        where: { status: { in: ["LIVE", "REGISTRATION"] } },
        orderBy: { startAt: "asc" },
        take: 3,
        include: { game: true, participants: { select: { teamName: true } } },
      }),
      getNavItemConfigs(),
    ]);

    return (
      <div className="flex min-h-screen flex-col">
        <Navbar user={null} navConfigs={navConfigs} />

        <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden">
          <HeroCarousel />

          <span className="animate-glow-pulse absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <span className="animate-glow-pulse absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent/15 blur-3xl [animation-delay:2s]" />

          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
            <Reveal>
              <p className="animate-float font-display text-xs font-semibold uppercase tracking-[0.4em] text-accent">
                Clutcher
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-tight tracking-wide text-foreground sm:text-6xl">
                Compete. Connect.
                <br />
                <span className="neon-text">Climb the Ranks.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mx-auto mt-5 max-w-xl text-sm text-muted sm:text-base">
                Join tournaments across Valorant, Rocket League, and CS2. Track your level, trade
                in the marketplace, and rise through the ranks.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary-glow"
                >
                  Get started
                  <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-14 lg:px-6">
          <Reveal>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              Your games
            </h2>
            <p className="mt-1 text-sm text-muted">Pick a battlefield.</p>
          </Reveal>
          <div className="mt-6">
            <GameShowcase />
          </div>
        </section>

        {highlightTournaments.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-4 pb-20 lg:px-6">
            <Reveal>
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-primary" />
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
                  Live &amp; upcoming
                </h2>
              </div>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {highlightTournaments.map((tournament, i) => (
                <Reveal key={tournament.id} delay={i * 0.1}>
                  <Link
                    href="/login"
                    className="block rounded-xl border border-border bg-surface-raised p-5 transition hover:border-primary/60"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {tournament.game.name}
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold text-foreground">
                      {tournament.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted">Prize pool</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatCompactCurrency(tournament.prizePool)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-muted">Registered</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatCapacityLabel(
                          tournament.participationType,
                          registeredCount(tournament.participationType, tournament.participants),
                          tournament.capacity,
                        )}
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <Footer />
      </div>
    );
  }

  const [user, levelXpRules, rankOverrides, pendingFriendRequests, unreadMessages, myParticipations, dailyProgress, wheelSpin, dailyDaysCount, wheelSlotsCount, upcomingTournaments, navConfigs] =
    await Promise.all([
      // A session can outlive the user it points at (JWT sessions aren't
      // invalidated when the row is deleted) — same defensive pattern as
      // (app)/layout.tsx: fall through to login instead of crashing.
      prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, level: true, xp: true, points: true, ccCoins: true, avatarUrl: true },
      }),
      prisma.levelXpRule.findMany({ select: { tier: true, xpPerLevel: true } }),
      prisma.rankTier.findMany(),
      countPendingReceived(userId),
      countUnreadMessages(userId),
      // No `include` on tournament here — it's a required relation in the
      // schema, but Mongo doesn't enforce that at the DB level, so a stale
      // participant row pointing at a since-deleted tournament would throw
      // instead of resolving to null. Fetched separately below and joined in
      // JS, same defensive pattern as the profile page.
      prisma.tournamentParticipant.findMany({ where: { userId } }),
      prisma.userDailyReward.findUnique({ where: { userId } }),
      prisma.userWheelSpin.findUnique({ where: { userId } }),
      prisma.dailyRewardDay.count(),
      prisma.luckyWheelSlot.count(),
      prisma.tournament.findMany({
        where: { status: { in: ["LIVE", "REGISTRATION"] } },
        orderBy: { startAt: "asc" },
        take: 6,
        include: { game: true, participants: { select: { teamName: true } } },
      }),
      getNavItemConfigs(),
    ]);

  if (!user) {
    redirect("/login");
  }

  const requiredXp = getRequiredXp(user.level, levelXpRules);

  const activeTournaments = await prisma.tournament.findMany({
    where: {
      id: { in: myParticipations.map((p) => p.tournamentId) },
      status: { in: ["REGISTRATION", "CHECK_IN", "LIVE"] },
    },
    include: { game: true },
  });
  const activeTournamentsById = new Map(activeTournaments.map((t) => [t.id, t]));

  const myActiveMatches = myParticipations
    .map((p) => ({ participant: p, tournament: activeTournamentsById.get(p.tournamentId) }))
    .filter(
      (x): x is { participant: (typeof myParticipations)[number]; tournament: NonNullable<typeof x.tournament> } =>
        !!x.tournament,
    )
    .sort((a, b) => a.tournament.startAt.getTime() - b.tournament.startAt.getTime());

  const myMatches: MatchRow[] = myActiveMatches.slice(0, 4).map(({ participant, tournament }) => ({
    id: participant.id,
    href: `/tournaments/${tournament.id}`,
    title: tournament.title,
    gameName: tournament.game.name,
    statusLabel: STATUS_LABEL[tournament.status] ?? tournament.status,
    statusTone: STATUS_TONE[tournament.status] ?? "bg-muted/15 text-muted",
    whenLabel: formatWhen(tournament.startAt, tournament.status),
  }));

  const nextMatch: NextMatch = myMatches[0]
    ? {
        href: myMatches[0].href,
        title: myMatches[0].title,
        gameName: myMatches[0].gameName,
        statusLabel: myMatches[0].statusLabel,
        whenLabel: myMatches[0].whenLabel,
      }
    : null;

  const now = new Date();
  const canClaimDaily = !dailyProgress?.lastClaimedAt || utcDayDiff(dailyProgress.lastClaimedAt, now) >= 1;
  const canSpin = !wheelSpin || utcDayDiff(wheelSpin.lastSpinAt, now) >= 1;

  const registeredIds = new Set(myParticipations.map((p) => p.tournamentId));
  const highlightTournaments = upcomingTournaments.filter((t) => !registeredIds.has(t.id)).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AmbientBackground />
      <Navbar
        user={{
          username: user.username,
          level: user.level,
          avatarUrl: user.avatarUrl,
          ccCoins: user.ccCoins,
          pendingFriendRequests,
          initialUnreadMessages: unreadMessages,
        }}
        rankOverrides={rankOverrides}
        navConfigs={navConfigs}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:px-6">
        <div className="flex flex-col gap-8">
          <Reveal>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ScoreboardPanel
                  username={user.username}
                  avatarUrl={user.avatarUrl}
                  level={user.level}
                  xp={user.xp}
                  requiredXp={requiredXp}
                  rankOverrides={rankOverrides}
                  points={user.points}
                  nextMatch={nextMatch}
                />
              </div>
              <div className="flex flex-col gap-3 lg:h-full">
                <RewardStatusCard
                  icon={Gift}
                  label="Daily Reward"
                  configured={dailyDaysCount > 0}
                  ready={canClaimDaily}
                  readyLabel="Ready to claim"
                  waitingLabel="Claimed today"
                  notConfiguredLabel="Not set up yet"
                />
                <RewardStatusCard
                  icon={Dices}
                  label="Lucky Wheel"
                  configured={wheelSlotsCount > 0}
                  ready={canSpin}
                  readyLabel="Free spin ready"
                  waitingLabel="Already spun today"
                  notConfiguredLabel="Not set up yet"
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <MyMatches matches={myMatches} />
          </Reveal>

          <Reveal delay={0.15}>
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                Your games
              </h2>
              <p className="mt-1 text-sm text-muted">Pick a battlefield.</p>
              <div className="mt-4">
                <GameShowcase />
              </div>
            </div>
          </Reveal>

          {highlightTournaments.length > 0 && (
            <Reveal delay={0.2}>
              <div>
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-primary" />
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                    Live &amp; upcoming
                  </h2>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {highlightTournaments.map((tournament) => (
                    <Link
                      key={tournament.id}
                      href={`/tournaments/${tournament.id}`}
                      className="block rounded-xl border border-border bg-surface-raised p-5 transition hover:border-primary/60"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        {tournament.game.name}
                      </p>
                      <h3 className="mt-1 font-display text-base font-bold text-foreground">
                        {tournament.title}
                      </h3>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted">Prize pool</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatCompactCurrency(tournament.prizePool)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-muted">Registered</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatCapacityLabel(
                            tournament.participationType,
                            registeredCount(tournament.participationType, tournament.participants),
                            tournament.capacity,
                          )}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
