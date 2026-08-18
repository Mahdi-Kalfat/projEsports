import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { HeroCarousel } from "@/components/landing/hero-carousel";

// Shared shell for /login and /register — reuses the landing page's own
// HeroCarousel key art (design plan §13: bring auth to Persuade-mode parity
// with the landing hero rather than a bare centered card on a flat gradient).
// Split-screen on desktop; a shorter art band up top on mobile rather than
// dropping the art entirely, since the audience skews mobile-heavy.
export function AuthShell({
  eyebrow,
  title,
  accentWord,
  glow,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  accentWord: string;
  glow: "primary" | "accent";
  footer: ReactNode;
  children: ReactNode;
}) {
  const glowColor = glow === "primary" ? "rgba(255,30,60,0.8)" : "rgba(0,229,255,0.8)";
  const glowLineClass = glow === "primary" ? "via-primary" : "via-accent";
  const ambientStyle =
    glow === "primary"
      ? "radial-gradient(60% 50% at 50% 0%, rgba(255,30,60,0.16), transparent 60%), radial-gradient(45% 40% at 90% 100%, rgba(0,229,255,0.10), transparent 60%)"
      : "radial-gradient(60% 50% at 50% 0%, rgba(0,229,255,0.14), transparent 60%), radial-gradient(45% 40% at 10% 100%, rgba(255,30,60,0.14), transparent 60%)";

  return (
    <main className="flex min-h-screen flex-col lg:grid lg:grid-cols-2">
      <div className="relative h-56 shrink-0 overflow-hidden sm:h-72 lg:h-auto">
        <HeroCarousel />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/50 to-canvas/10 lg:bg-gradient-to-r lg:from-canvas lg:via-canvas/10 lg:to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-between p-6 lg:p-12">
          <Link href="/" className="flex items-center">
            <Image src="/logo-clutcher.png" alt="Clutcher" width={600} height={444} unoptimized priority className="h-11 w-auto" />
          </Link>
          <div className="hidden lg:block">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.4em] text-accent">
              Clutcher
            </p>
            <h2 className="mt-3 max-w-md font-display text-3xl font-bold uppercase leading-tight tracking-wide text-foreground">
              Compete. Connect.
              <br />
              <span className="neon-text">Climb the Ranks.</span>
            </h2>
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 lg:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: ambientStyle }} />

        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
            <h1 className="mt-3 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              {title} <span className="neon-text">{accentWord}</span>
            </h1>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border bg-surface-raised p-8 shadow-2xl">
            <div
              aria-hidden
              className={`absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent ${glowLineClass} to-transparent`}
              style={{ boxShadow: `0 0 8px 1px ${glowColor}` }}
            />
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-muted lg:text-left">{footer}</p>
        </div>
      </div>
    </main>
  );
}
