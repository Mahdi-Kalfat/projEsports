import type { ReactNode } from "react";
import { Reveal } from "./reveal";

// The landing-page treatment (eyebrow + big display title + subtitle) reused as the
// header for every inner (app) page, so Tournaments/Events/Shop/Marketplace/Profile
// open with the same visual weight as "/" instead of a plain admin-style <h1>.
export function PageHeader({
  eyebrow,
  title,
  accentWord,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  accentWord?: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <Reveal>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-foreground sm:text-4xl">
            {title} {accentWord && <span className="neon-text">{accentWord}</span>}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
    </Reveal>
  );
}
