import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

// Shown at the top of every guest-browsable page (tournaments, shop,
// marketplace, battle-pass, rewards) — the pitch for creating an account,
// not just a passive "you're not logged in" notice. Same glow-pulse
// language as the landing hero's ambient blobs (see globals.css) so it
// reads as on-brand rather than a bolted-on banner.
export function GuestBanner({
  message = "Create a free account to join tournaments, spin the Lucky Wheel, and trade in the marketplace.",
}: {
  message?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-surface-raised to-accent/10 p-5 sm:p-6">
      <span className="animate-glow-pulse pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
      <span className="animate-glow-pulse pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl [animation-delay:2s]" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
              You&apos;re browsing as a guest
            </p>
            <p className="mt-0.5 max-w-md text-sm text-muted">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="btn-neon inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow"
          >
            Create free account
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
