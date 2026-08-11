import type { ReactNode } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import type { ClanSummary } from "./types";

export function ClanHeader({ clan, action }: { clan: ClanSummary; action?: ReactNode }) {
  const isPrivate = clan.visibility === "PRIVATE";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
      <div className="relative h-40 overflow-hidden sm:h-52">
        {clan.bannerUrl ? (
          <Image src={clan.bannerUrl} alt="" fill unoptimized className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-surface-raised to-accent/20" />
        )}
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-transparent to-transparent" />

        <span
          className={`absolute right-5 top-5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${
            isPrivate ? "bg-warning/15 text-warning ring-1 ring-warning/30" : "bg-success/15 text-success ring-1 ring-success/30"
          }`}
        >
          {isPrivate && <Lock size={12} />}
          {isPrivate ? "Private" : "Public"}
        </span>
      </div>

      <div className="relative px-6 pb-6 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-12 flex items-end gap-4">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-surface-raised bg-surface font-display text-2xl font-bold text-primary shadow-2xl">
              {clan.logoUrl ? (
                <Image src={clan.logoUrl} alt="" width={96} height={96} unoptimized className="object-contain" />
              ) : (
                clan.tag.slice(0, 2)
              )}
            </span>
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                [{clan.tag}]
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">{clan.name}</h1>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">{action}</div>
        </div>

        {clan.description && <p className="mt-5 whitespace-pre-wrap text-sm text-muted">{clan.description}</p>}

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center sm:text-left">
          <div>
            <p className="text-xs text-muted">Members</p>
            <p className="font-display text-lg font-bold text-foreground">
              {clan.memberCount}/{clan.maxMembers}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Min level</p>
            <p className="font-display text-lg font-bold text-foreground">{clan.minLevel}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Visibility</p>
            <p className="font-display text-lg font-bold text-foreground">{isPrivate ? "Private" : "Public"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
