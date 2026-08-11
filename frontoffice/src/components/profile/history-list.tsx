import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export type HistoryEntry = {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  href: string;
};

export function HistoryList({
  title,
  icon: Icon,
  entries,
  emptyLabel,
}: {
  title: string;
  icon: LucideIcon;
  entries: HistoryEntry[];
  emptyLabel: string;
}) {
  return (
    <Reveal>
      <div className="rounded-2xl border border-border bg-surface-raised p-5">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-primary" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            {title}
          </h3>
        </div>

        {entries.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{emptyLabel}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={entry.href}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm transition hover:border-primary/60"
                >
                  <div>
                    <p className="font-medium text-foreground">{entry.title}</p>
                    <p className="text-xs text-muted">{entry.subtitle}</p>
                  </div>
                  <span className="text-xs text-muted">{entry.dateLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Reveal>
  );
}
