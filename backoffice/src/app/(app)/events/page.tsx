import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildEventsHref } from "@/lib/events-query";
import { AddEventModal } from "@/components/events/add-event-modal";
import { EventCard } from "@/components/events/event-card";
import { EventDetailModal } from "@/components/events/event-detail-modal";

export const metadata: Metadata = {
  title: "Events — Back Office",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EventsPage(props: PageProps<"/events">) {
  const searchParams = await props.searchParams;
  const eventId = firstParam(searchParams.eventId);

  const [events, games, selectedEvent, attendees] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startAt: "desc" },
      include: { game: true, _count: { select: { attendees: true } } },
    }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    eventId
      ? prisma.event.findUnique({ where: { id: eventId }, include: { game: true } })
      : Promise.resolve(null),
    eventId
      ? prisma.eventAttendee.findMany({
          where: { eventId },
          include: { user: { select: { username: true } } },
          orderBy: { joinedAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const gameOptions = games.map((game) => ({ id: game.id, name: game.name }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddEventModal games={gameOptions} />
      </div>

      {events.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border bg-surface-raised text-sm text-muted">
          No events yet — create the first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              href={buildEventsHref({ eventId: event.id })}
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
                startAtLabel: formatDateTime(event.startAt),
              }}
            />
          ))}
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal
          closeHref="/events"
          games={gameOptions}
          event={{
            id: selectedEvent.id,
            title: selectedEvent.title,
            description: selectedEvent.description,
            additionalInfo: selectedEvent.additionalInfo,
            status: selectedEvent.status,
            type: selectedEvent.type,
            gameId: selectedEvent.gameId,
            gameName: selectedEvent.game?.name ?? null,
            location: selectedEvent.location,
            capacity: selectedEvent.capacity,
            backgroundImageUrl: selectedEvent.backgroundImageUrl,
            logoImageUrl: selectedEvent.logoImageUrl,
            startAtLabel: formatDateTime(selectedEvent.startAt),
            startAtLocal: toDatetimeLocalValue(selectedEvent.startAt),
            endAtLabel: selectedEvent.endAt ? formatDateTime(selectedEvent.endAt) : null,
            endAtLocal: selectedEvent.endAt ? toDatetimeLocalValue(selectedEvent.endAt) : "",
          }}
          attendees={attendees.map((attendee) => ({
            id: attendee.id,
            username: attendee.user.username,
            joinedLabel: formatDateTime(attendee.joinedAt),
          }))}
        />
      )}
    </div>
  );
}
