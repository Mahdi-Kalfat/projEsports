"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { syncUserBadges } from "@/lib/award-badges";

export type RsvpEventState = { error?: string; success?: boolean };

const JOINABLE_STATUSES = ["SCHEDULED", "LIVE"];

export async function rsvpEvent(
  eventId: string,
  _prevState: RsvpEventState,
  _formData: FormData,
): Promise<RsvpEventState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { attendees: true } } },
  });
  if (!event) return { error: "Event not found." };

  if (!JOINABLE_STATUSES.includes(event.status)) {
    return { error: "RSVPs are closed for this event." };
  }

  if (event.capacity !== null && event._count.attendees >= event.capacity) {
    return { error: "This event is full." };
  }

  const existing = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (existing) return { error: "You already RSVP'd to this event." };

  await prisma.eventAttendee.create({ data: { eventId, userId } });
  await syncUserBadges(userId);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  return { success: true };
}
