"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { NoArtFallback } from "@/components/ui/no-art-fallback";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<string, string> = {
  SCHEDULED: "bg-accent/15 text-accent ring-1 ring-accent/30",
  LIVE: "bg-success/15 text-success ring-1 ring-success/30",
  COMPLETED: "bg-primary/15 text-primary ring-1 ring-primary/30",
  ARCHIVED: "bg-muted/15 text-muted ring-1 ring-muted/20",
  CANCELLED: "bg-warning/15 text-warning ring-1 ring-warning/30",
};

export const TYPE_LABEL: Record<string, string> = {
  COMMUNITY: "Community",
  NEWS: "News",
  MAINTENANCE: "Maintenance",
  GIVEAWAY: "Giveaway",
  ANNOUNCEMENT: "Announcement",
  PARTNERSHIP: "Partnership",
};

export type EventCardData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  type: string;
  gameName: string | null;
  location: string | null;
  capacity: number | null;
  backgroundImageUrl: string | null;
  logoImageUrl: string | null;
  attendingCount: number;
  attendeePreview: { username: string; avatarUrl: string | null }[];
  startAtLabel: string;
  isAttending: boolean;
};

export function EventCard({ event }: { event: EventCardData }) {
  const overflowCount = event.attendingCount - event.attendeePreview.length;

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: "easeOut" }} className="h-full">
      <Link
        href={`/events/${event.id}`}
        className="hover-glow group block h-full overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors hover:border-primary/50"
      >
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
          {event.backgroundImageUrl ? (
            <Image
              src={event.backgroundImageUrl}
              alt=""
              fill
              unoptimized
              className="object-cover transition duration-500 group-hover:scale-110"
            />
          ) : (
            <NoArtFallback gameName={event.gameName} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />

          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
              STATUS_TONE[event.status] ?? "bg-muted/15 text-muted ring-1 ring-muted/20"
            }`}
          >
            {STATUS_LABEL[event.status] ?? event.status}
          </span>
          {event.isAttending && (
            <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-canvas shadow-[0_0_12px_rgba(40,255,139,0.5)]">
              Going
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
            {event.logoImageUrl && (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-surface-raised bg-surface shadow-lg">
                <Image src={event.logoImageUrl} alt="" width={44} height={44} unoptimized className="object-contain" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                {event.gameName ?? "All games"} · {TYPE_LABEL[event.type] ?? event.type}
              </p>
              <h3 className="truncate font-display text-lg font-bold text-white">{event.title}</h3>
            </div>
          </div>
        </div>

        <div className="p-4">
          {event.description && <p className="line-clamp-2 text-sm text-muted">{event.description}</p>}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
            <div>
              <p className="text-xs text-muted">Attending</p>
              {event.attendeePreview.length > 0 ? (
                <div className="mt-1 flex items-center">
                  {event.attendeePreview.map((attendee) => (
                    <span
                      key={attendee.username}
                      className="-ml-2 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface-raised bg-primary/15 font-display text-[10px] font-semibold text-primary first:ml-0"
                    >
                      {attendee.avatarUrl ? (
                        <Image src={attendee.avatarUrl} alt="" width={28} height={28} unoptimized className="object-cover" />
                      ) : (
                        attendee.username.slice(0, 1).toUpperCase()
                      )}
                    </span>
                  ))}
                  {overflowCount > 0 && (
                    <span className="-ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-surface-raised bg-surface text-[10px] font-semibold text-muted">
                      +{overflowCount}
                    </span>
                  )}
                </div>
              ) : (
                <p className="font-semibold text-foreground">
                  {event.capacity ? `0/${event.capacity}` : "0"}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Location</p>
              <p className="font-semibold text-foreground">{event.location ?? "TBA"}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted">{event.startAtLabel}</p>
        </div>
      </Link>
    </motion.div>
  );
}
