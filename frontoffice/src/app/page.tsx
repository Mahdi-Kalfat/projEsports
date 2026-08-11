import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactCurrency } from "@/lib/format";
import { HeroCarousel } from "@/components/landing/hero-carousel";
import { GameShowcase } from "@/components/landing/game-showcase";
import { Reveal } from "@/components/ui/reveal";
import { Footer } from "@/components/nav/footer";
import { ArrowRight, Trophy } from "lucide-react";

export default async function HomePage() {
  const [session, highlightTournaments] = await Promise.all([
    auth(),
    prisma.tournament.findMany({
      where: { status: { in: ["LIVE", "REGISTRATION"] } },
      orderBy: { startAt: "asc" },
      take: 3,
      include: { game: true, _count: { select: { participants: true } } },
    }),
  ]);

  const isLoggedIn = !!session?.user;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-6 lg:px-6">
          <span className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Esport<span className="neon-text">Web</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/tournaments"
                className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow"
              >
                Enter platform
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow"
                >
                  Join now
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
        <HeroCarousel />

        <span className="animate-glow-pulse absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <span className="animate-glow-pulse absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent/15 blur-3xl [animation-delay:2s]" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <p className="animate-float font-display text-xs font-semibold uppercase tracking-[0.4em] text-accent">
              Esports Tournament Platform
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
                href={isLoggedIn ? "/tournaments" : "/register"}
                className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary-glow"
              >
                {isLoggedIn ? "Browse tournaments" : "Get started"}
                <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-6">
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
                  href={isLoggedIn ? `/tournaments/${tournament.id}` : "/login"}
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
                    <span className="font-semibold text-foreground">
                      {formatCompactCurrency(tournament.prizePool)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-muted">Registered</span>
                    <span className="font-semibold text-foreground">
                      {tournament._count.participants}
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
