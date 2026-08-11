"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";
import { eventSchema } from "@/lib/validation/event";
import { EventStatus } from "@/generated/prisma";

export type CreateEventState = { error?: string; success?: boolean };

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: formData.get("title"),
    startAt: formData.get("startAt"),
    type: formData.get("type"),
    location: formData.get("location"),
    description: formData.get("description"),
    additionalInfo: formData.get("additionalInfo"),
  });
}

function parseOptionalEndAt(raw: FormDataEntryValue | null, startAt: Date) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as Date | undefined };
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return { error: "Enter a valid end date & time." };
  if (date < startAt) return { error: "End time must be after the start time." };
  return { value: date };
}

function parseOptionalCapacity(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as number | undefined };
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return { error: "Capacity must be a positive whole number." };
  return { value };
}

async function resolveGameId(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as string | undefined };
  const game = await prisma.game.findUnique({ where: { id: raw } });
  if (!game) return { error: "Pick a valid game." };
  return { value: raw };
}

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  await requireBackofficeSession();

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const game = await resolveGameId(formData.get("gameId"));
  if ("error" in game) return { error: game.error };

  const endAt = parseOptionalEndAt(formData.get("endAt"), parsed.data.startAt);
  if ("error" in endAt) return { error: endAt.error };

  const capacity = parseOptionalCapacity(formData.get("capacity"));
  if ("error" in capacity) return { error: capacity.error };

  const backgroundImage = formData.get("backgroundImage");
  const logoImage = formData.get("logoImage");

  let backgroundImageUrl: string | undefined;
  if (backgroundImage instanceof File) {
    const result = await saveUploadedImage(backgroundImage, "events");
    if (result && "error" in result) return { error: result.error };
    backgroundImageUrl = result?.url;
  }

  let logoImageUrl: string | undefined;
  if (logoImage instanceof File) {
    const result = await saveUploadedImage(logoImage, "events");
    if (result && "error" in result) return { error: result.error };
    logoImageUrl = result?.url;
  }

  await prisma.event.create({
    data: {
      title: parsed.data.title,
      startAt: parsed.data.startAt,
      endAt: endAt.value,
      type: parsed.data.type,
      gameId: game.value,
      location: parsed.data.location,
      capacity: capacity.value,
      description: parsed.data.description,
      additionalInfo: parsed.data.additionalInfo,
      backgroundImageUrl,
      logoImageUrl,
    },
  });

  revalidatePath("/events");
  return { success: true };
}

export async function updateEvent(
  eventId: string,
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  await requireBackofficeSession();

  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) return { error: "That event no longer exists." };

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const game = await resolveGameId(formData.get("gameId"));
  if ("error" in game) return { error: game.error };

  const endAt = parseOptionalEndAt(formData.get("endAt"), parsed.data.startAt);
  if ("error" in endAt) return { error: endAt.error };

  const capacity = parseOptionalCapacity(formData.get("capacity"));
  if ("error" in capacity) return { error: capacity.error };

  const backgroundImage = formData.get("backgroundImage");
  const logoImage = formData.get("logoImage");

  let backgroundImageUrl = existing.backgroundImageUrl;
  if (backgroundImage instanceof File) {
    const result = await saveUploadedImage(backgroundImage, "events");
    if (result && "error" in result) return { error: result.error };
    if (result) backgroundImageUrl = result.url;
  }

  let logoImageUrl = existing.logoImageUrl;
  if (logoImage instanceof File) {
    const result = await saveUploadedImage(logoImage, "events");
    if (result && "error" in result) return { error: result.error };
    if (result) logoImageUrl = result.url;
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: parsed.data.title,
      startAt: parsed.data.startAt,
      endAt: endAt.value ?? null,
      type: parsed.data.type,
      gameId: game.value ?? null,
      location: parsed.data.location ?? null,
      capacity: capacity.value ?? null,
      description: parsed.data.description ?? null,
      additionalInfo: parsed.data.additionalInfo ?? null,
      backgroundImageUrl,
      logoImageUrl,
    },
  });

  revalidatePath("/events");
  return { success: true };
}

export async function deleteEvent(eventId: string, _formData: FormData) {
  await requireBackofficeSession();

  await prisma.eventAttendee.deleteMany({ where: { eventId } });
  await prisma.event.deleteMany({ where: { id: eventId } });

  revalidatePath("/events");
  redirect("/events");
}

const ASSIGNABLE_STATUSES: string[] = [
  EventStatus.DRAFT,
  EventStatus.SCHEDULED,
  EventStatus.LIVE,
  EventStatus.COMPLETED,
  EventStatus.ARCHIVED,
  EventStatus.CANCELLED,
];

export async function setEventStatus(eventId: string, formData: FormData) {
  await requireBackofficeSession();

  const status = formData.get("status");
  if (typeof status !== "string" || !ASSIGNABLE_STATUSES.includes(status)) return;

  await prisma.event.update({
    where: { id: eventId },
    data: { status: status as EventStatus },
  });
  revalidatePath("/events");
}
