import Link from "next/link";
import { ArrowRight, Swords } from "lucide-react";

export type MatchRow = {
  id: string;
  href: string;
  title: string;
  gameName: string;
  statusLabel: string;
  statusTone: string;
  whenLabel: string;
};

// Real registrations only — see design plan's "do not create fake data" note.
// An empty list means the player genuinely isn't registered anywhere yet, which
// is itself useful information, not a state to paper over.
export function MyMatches({ matches }: { matches: MatchRow[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Swords size={16} className="text-primary" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
          Your matches
        </h2>
      </div>

      {matches.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-8 text-center">
          <p className="text-sm text-muted">You&apos;re not registered for anything yet.</p>
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary transition hover:text-primary-glow"
          >
            Browse tournaments
            <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                href={m.href}
                className="group flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3 transition hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted">{m.gameName}</p>
                  <p className="truncate font-display text-sm font-bold text-foreground">{m.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${m.statusTone}`}>
                    {m.statusLabel}
                  </span>
                  <span className="text-xs tabular-nums text-muted">{m.whenLabel}</span>
                  <ArrowRight
                    size={14}
                    className="text-muted transition group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
