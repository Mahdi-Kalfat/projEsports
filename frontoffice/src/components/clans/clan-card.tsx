"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Users } from "lucide-react";
import type { ClanSummary } from "./types";

export function ClanCard({ clan }: { clan: ClanSummary }) {
  const isPrivate = clan.visibility === "PRIVATE";

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: "easeOut" }} className="h-full">
      <Link
        href={`/clans/${clan.id}`}
        className="hover-glow group block h-full overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors hover:border-primary/50"
      >
        <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
          {clan.bannerUrl && (
            <Image
              src={clan.bannerUrl}
              alt=""
              fill
              unoptimized
              className="object-cover transition duration-500 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
          <span
            className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
              isPrivate ? "bg-warning/15 text-warning ring-1 ring-warning/30" : "bg-success/15 text-success ring-1 ring-success/30"
            }`}
          >
            {isPrivate && <Lock size={11} />}
            {isPrivate ? "Private" : "Public"}
          </span>

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-surface-raised bg-surface font-display text-sm font-bold text-primary shadow-lg">
              {clan.logoUrl ? (
                <Image src={clan.logoUrl} alt="" width={40} height={40} unoptimized className="object-contain" />
              ) : (
                clan.tag.slice(0, 2)
              )}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">[{clan.tag}]</p>
              <h3 className="truncate font-display text-base font-bold text-white">{clan.name}</h3>
            </div>
          </div>
        </div>

        <div className="p-4">
          {clan.description && <p className="line-clamp-2 text-sm text-muted">{clan.description}</p>}

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-muted" />
              <span className="font-semibold text-foreground">
                {clan.memberCount}/{clan.maxMembers}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Min level</p>
              <p className="font-semibold text-foreground">{clan.minLevel}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
