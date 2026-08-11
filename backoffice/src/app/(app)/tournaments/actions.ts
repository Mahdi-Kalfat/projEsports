"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";
import { tournamentSchema } from "@/lib/validation/tournament";
import { EntryType, ParticipationType, TournamentStatus } from "@/generated/prisma";

export type CreateTournamentState = { error?: string; success?: boolean };

function parseTournamentForm(formData: FormData) {
  return tournamentSchema.safeParse({
    title: formData.get("title"),
    startAt: formData.get("startAt"),
    gameId: formData.get("gameId"),
    description: formData.get("description"),
    additionalInfo: formData.get("additionalInfo"),
    prizePool: formData.get("prizePool"),
    entryCost: formData.get("entryCost"),
    participationType: formData.get("participationType"),
  });
}

export async function createTournament(
  _prevState: CreateTournamentState,
  formData: FormData,
): Promise<CreateTournamentState> {
  await requireBackofficeSession();

  const parsed = parseTournamentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const game = await prisma.game.findUnique({ where: { id: parsed.data.gameId } });
  if (!game) return { error: "Pick a valid game." };

  const backgroundImage = formData.get("backgroundImage");
  const logoImage = formData.get("logoImage");

  let backgroundImageUrl: string | undefined;
  if (backgroundImage instanceof File) {
    const result = await saveUploadedImage(backgroundImage, "tournaments");
    if (result && "error" in result) return { error: result.error };
    backgroundImageUrl = result?.url;
  }

  let logoImageUrl: string | undefined;
  if (logoImage instanceof File) {
    const result = await saveUploadedImage(logoImage, "tournaments");
    if (result && "error" in result) return { error: result.error };
    logoImageUrl = result?.url;
  }

  await prisma.tournament.create({
    data: {
      title: parsed.data.title,
      startAt: parsed.data.startAt,
      gameId: parsed.data.gameId,
      description: parsed.data.description,
      additionalInfo: parsed.data.additionalInfo,
      prizePool: parsed.data.prizePool,
      entryCost: parsed.data.entryCost,
      entryType: parsed.data.entryCost > 0 ? EntryType.MONEY : EntryType.FREE,
      participationType: parsed.data.participationType as ParticipationType,
      backgroundImageUrl,
      logoImageUrl,
    },
  });

  revalidatePath("/tournaments");
  return { success: true };
}

export async function updateTournament(
  tournamentId: string,
  _prevState: CreateTournamentState,
  formData: FormData,
): Promise<CreateTournamentState> {
  await requireBackofficeSession();

  const existing = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!existing) return { error: "That tournament no longer exists." };

  const parsed = parseTournamentForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const game = await prisma.game.findUnique({ where: { id: parsed.data.gameId } });
  if (!game) return { error: "Pick a valid game." };

  const backgroundImage = formData.get("backgroundImage");
  const logoImage = formData.get("logoImage");

  let backgroundImageUrl = existing.backgroundImageUrl;
  if (backgroundImage instanceof File) {
    const result = await saveUploadedImage(backgroundImage, "tournaments");
    if (result && "error" in result) return { error: result.error };
    if (result) backgroundImageUrl = result.url;
  }

  let logoImageUrl = existing.logoImageUrl;
  if (logoImage instanceof File) {
    const result = await saveUploadedImage(logoImage, "tournaments");
    if (result && "error" in result) return { error: result.error };
    if (result) logoImageUrl = result.url;
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      title: parsed.data.title,
      startAt: parsed.data.startAt,
      gameId: parsed.data.gameId,
      description: parsed.data.description,
      additionalInfo: parsed.data.additionalInfo,
      prizePool: parsed.data.prizePool,
      entryCost: parsed.data.entryCost,
      entryType: parsed.data.entryCost > 0 ? EntryType.MONEY : EntryType.FREE,
      participationType: parsed.data.participationType as ParticipationType,
      backgroundImageUrl,
      logoImageUrl,
    },
  });

  revalidatePath("/tournaments");
  return { success: true };
}

export async function deleteTournament(tournamentId: string, _formData: FormData) {
  await requireBackofficeSession();

  await prisma.tournamentParticipant.deleteMany({ where: { tournamentId } });
  await prisma.tournament.deleteMany({ where: { id: tournamentId } });

  revalidatePath("/tournaments");
  redirect("/tournaments");
}

const ASSIGNABLE_STATUSES: string[] = [
  TournamentStatus.DRAFT,
  TournamentStatus.REGISTRATION,
  TournamentStatus.CHECK_IN,
  TournamentStatus.LIVE,
  TournamentStatus.COMPLETED,
  TournamentStatus.ARCHIVED,
];

export async function setTournamentStatus(tournamentId: string, formData: FormData) {
  await requireBackofficeSession();

  const status = formData.get("status");
  if (typeof status !== "string" || !ASSIGNABLE_STATUSES.includes(status)) return;

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: status as TournamentStatus },
  });
  revalidatePath("/tournaments");
}
