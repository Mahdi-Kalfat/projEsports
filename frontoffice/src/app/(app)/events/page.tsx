import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CalendarDays } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { Reveal } from "@/components/ui/reveal";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Events — Clutcher",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [events, myAttendances] = await Promise.all([
    prisma.event.findMany({
      where: { status: { not: "DRAFT" } },
      orderBy: { startAt: "asc" },
      include: {
        game: true,
        _count: { select: { attendees: true } },
        attendees: { take: 5, include: { user: { select: { username: true, avatarUrl: true } } } },
      },
    }),
    prisma.eventAttendee.findMany({ where: { userId }, select: { eventId: true } }),
  ]);

  const attendingIds = new Set(myAttendances.map((a) => a.eventId));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Connect"
        title="Community"
        accentWord="events"
        subtitle="News, giveaways, meetups, and everything happening outside the bracket."
      />

      {events.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
          <CalendarDays size={28} className="text-muted/50" />
          No events scheduled right now — check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <Reveal key={event.id} delay={Math.min(i * 0.05, 0.3)}>
              <EventCard
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  status: event.status,
                  type: event.type,
                  gameName: event.game?.name ?? null,
                  location: event.location,
                  capacity: event.capacity,
                  backgroundImageUrl: event.backgroundImageUrl,
                  logoImageUrl: event.logoImageUrl,
                  attendingCount: event._count.attendees,
                  attendeePreview: event.attendees.map((a) => ({
                    username: a.user.username,
                    avatarUrl: a.user.avatarUrl,
                  })),
                  startAtLabel: formatDateTime(event.startAt),
                  isAttending: attendingIds.has(event.id),
                }}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
