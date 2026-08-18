import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/ui/reveal";
import { RsvpButton } from "@/components/events/rsvp-button";
import { TYPE_LABEL } from "@/components/events/event-card";
import { BackLink } from "@/components/ui/back-link";

export async function generateMetadata(props: PageProps<"/events/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const event = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  return { title: event ? `${event.title} — Events` : "Event" };
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

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

const JOINABLE_STATUSES = ["SCHEDULED", "LIVE"];

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default async function EventDetailPage(props: PageProps<"/events/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      game: true,
      attendees: {
        include: { user: { select: { username: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!event || event.status === "DRAFT") notFound();

  const isAttending = event.attendees.some((a) => a.userId === userId);
  const isFull = event.capacity !== null && event.attendees.length >= event.capacity;
  const canRsvp = JOINABLE_STATUSES.includes(event.status) && !isFull;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/events" label="All events" />

      <Reveal>
        <div className="relative h-72 overflow-hidden rounded-2xl border border-border sm:h-96">
          {event.backgroundImageUrl ? (
            <Image src={event.backgroundImageUrl} alt="" fill unoptimized priority className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-raised" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          <span
            className={`absolute right-5 top-5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${
              STATUS_TONE[event.status] ?? "bg-muted/15 text-muted ring-1 ring-muted/20"
            }`}
          >
            {STATUS_LABEL[event.status] ?? event.status}
          </span>

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-6 sm:p-10">
            {event.logoImageUrl && (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white/20 bg-surface shadow-2xl sm:h-20 sm:w-20">
                <Image src={event.logoImageUrl} alt="" width={64} height={64} unoptimized className="object-contain" />
              </span>
            )}
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                {event.game?.name ?? "All games"} · {TYPE_LABEL[event.type] ?? event.type}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold uppercase text-white sm:text-4xl">{event.title}</h1>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass-panel relative z-10 mx-auto -mt-10 w-full max-w-3xl rounded-2xl border border-border p-6 shadow-2xl sm:-mt-14 sm:p-8">
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <InfoField label="Starts" value={formatDateTime(event.startAt)} />
            <InfoField label="Ends" value={event.endAt ? formatDateTime(event.endAt) : "—"} />
            <InfoField label="Location" value={event.location ?? "TBA"} />
            <InfoField label="Capacity" value={event.capacity ? `${event.capacity} spots` : "Unlimited"} />
          </dl>

          {event.description && <p className="mt-5 text-sm text-muted">{event.description}</p>}
          {event.additionalInfo && (
            <div className="mt-4 rounded-md border border-border bg-surface px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Additional information</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{event.additionalInfo}</p>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-5">
            {isAttending ? (
              <div className="rounded-md bg-success/15 px-3 py-2.5 text-center text-sm font-medium text-success">
                You&apos;re on the list!
              </div>
            ) : canRsvp ? (
              <RsvpButton eventId={event.id} />
            ) : isFull ? (
              <p className="rounded-md bg-warning/10 px-3 py-2.5 text-center text-sm text-warning">
                This event is full.
              </p>
            ) : (
              <p className="rounded-md bg-muted/10 px-3 py-2.5 text-center text-sm text-muted">
                RSVPs are closed for this event.
              </p>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Users size={14} />
            Attending ({event.attendees.length})
          </div>
          {event.attendees.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No one has RSVP&apos;d yet — be the first.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {event.attendees.map((a) => (
                <li key={a.id} className="rounded-full border border-border px-3 py-1 text-xs text-foreground">
                  {a.user.username}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
