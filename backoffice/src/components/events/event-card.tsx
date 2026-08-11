import Image from "next/image";
import Link from "next/link";

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  CANCELLED: "Cancelled",
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-muted/15 text-muted",
  SCHEDULED: "bg-accent/15 text-accent",
  LIVE: "bg-success/15 text-success",
  COMPLETED: "bg-primary/15 text-primary",
  ARCHIVED: "bg-muted/15 text-muted",
  CANCELLED: "bg-warning/15 text-warning",
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
  startAtLabel: string;
};

export function EventCard({ event, href }: { event: EventCardData; href: string }) {
  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-xl border border-border bg-surface-raised transition hover:border-primary/60"
    >
      <div className="relative h-28 w-full bg-gradient-to-br from-surface to-surface-raised">
        {event.backgroundImageUrl && (
          <Image src={event.backgroundImageUrl} alt="" fill unoptimized className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-transparent to-black/30" />
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_TONE[event.status] ?? "bg-muted/15 text-muted"
          }`}
        >
          {STATUS_LABEL[event.status] ?? event.status}
        </span>
        {event.logoImageUrl && (
          <span className="absolute -bottom-5 left-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border-2 border-surface-raised bg-surface">
            <Image src={event.logoImageUrl} alt="" width={44} height={44} unoptimized className="object-contain" />
          </span>
        )}
      </div>

      <div className={event.logoImageUrl ? "p-4 pt-7" : "p-4"}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {event.gameName ?? "All games"} · {TYPE_LABEL[event.type] ?? event.type}
        </p>
        <h3 className="mt-1 font-display text-base font-bold text-foreground">{event.title}</h3>
        {event.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{event.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted">Attending</p>
            <p className="font-semibold text-foreground">
              {event.capacity ? `${event.attendingCount}/${event.capacity}` : event.attendingCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Location</p>
            <p className="font-semibold text-foreground">{event.location ?? "TBA"}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">{event.startAtLabel}</p>
      </div>
    </Link>
  );
}
