"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";
import { bracketSize } from "@/lib/bracket";
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

// Mirrors events/actions.ts's parseOptionalCapacity — hand-parsed rather than
// part of tournamentSchema for the same reason: empty means "unlimited," not
// a validation failure.
function parseOptionalCapacity(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as number | undefined };
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return { error: "Capacity must be a positive whole number." };
  return { value };
}

function parseOptionalMaxTeamSize(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as number | undefined };
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    return { error: "Max team size must be a whole number of at least 1." };
  }
  return { value };
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

  const capacity = parseOptionalCapacity(formData.get("capacity"));
  if ("error" in capacity) return { error: capacity.error };

  const maxTeamSize = parseOptionalMaxTeamSize(formData.get("maxTeamSize"));
  if ("error" in maxTeamSize) return { error: maxTeamSize.error };

  const rawAverageRankName = formData.get("averageRankName");
  const averageRankName =
    typeof rawAverageRankName === "string" && rawAverageRankName.trim()
      ? rawAverageRankName.trim().slice(0, 40)
      : undefined;

  const rawRegion = formData.get("region");
  const region = typeof rawRegion === "string" && rawRegion.trim() ? rawRegion.trim().slice(0, 40) : undefined;

  const backgroundImage = formData.get("backgroundImage");
  const logoImage = formData.get("logoImage");
  const averageRankImage = formData.get("averageRankImage");

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

  let averageRankImageUrl: string | undefined;
  if (averageRankImage instanceof File) {
    const result = await saveUploadedImage(averageRankImage, "tournaments");
    if (result && "error" in result) return { error: result.error };
    averageRankImageUrl = result?.url;
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
      capacity: capacity.value,
      maxTeamSize: maxTeamSize.value,
      averageRankName,
      region,
      backgroundImageUrl,
      logoImageUrl,
      averageRankImageUrl,
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

  const capacity = parseOptionalCapacity(formData.get("capacity"));
  if ("error" in capacity) return { error: capacity.error };

  const maxTeamSize = parseOptionalMaxTeamSize(formData.get("maxTeamSize"));
  if ("error" in maxTeamSize) return { error: maxTeamSize.error };

  const rawAverageRankName = formData.get("averageRankName");
  const averageRankName =
    typeof rawAverageRankName === "string" && rawAverageRankName.trim()
      ? rawAverageRankName.trim().slice(0, 40)
      : null;

  const rawRegion = formData.get("region");
  const region = typeof rawRegion === "string" && rawRegion.trim() ? rawRegion.trim().slice(0, 40) : null;

  const backgroundImage = formData.get("backgroundImage");
  const logoImage = formData.get("logoImage");
  const averageRankImage = formData.get("averageRankImage");

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

  let averageRankImageUrl = existing.averageRankImageUrl;
  if (averageRankImage instanceof File) {
    const result = await saveUploadedImage(averageRankImage, "tournaments");
    if (result && "error" in result) return { error: result.error };
    if (result) averageRankImageUrl = result.url;
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
      capacity: capacity.value ?? null,
      maxTeamSize: maxTeamSize.value ?? null,
      averageRankName,
      region,
      backgroundImageUrl,
      logoImageUrl,
      averageRankImageUrl,
    },
  });

  revalidatePath("/tournaments");
  return { success: true };
}

export async function deleteTournament(tournamentId: string, _formData: FormData) {
  await requireBackofficeSession();

  const registrationIds = (
    await prisma.tournamentRegistration.findMany({ where: { tournamentId }, select: { id: true } })
  ).map((r) => r.id);
  await prisma.tournamentRegistrationMember.deleteMany({ where: { registrationId: { in: registrationIds } } });
  await prisma.tournamentRegistration.deleteMany({ where: { tournamentId } });
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

export type RegistrationActionState = { error?: string; success?: boolean };

// The only place TournamentParticipant rows get created for a TEAM
// tournament — mirrors the front office's per-player POINTS charge in
// joinTournament, just applied to every roster member at once (all-or-
// nothing: if any member is short on points, nobody gets charged or added).
export async function approveTournamentRegistration(
  registrationId: string,
  _prevState: RegistrationActionState,
  _formData: FormData,
): Promise<RegistrationActionState> {
  await requireBackofficeSession();

  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { members: true, tournament: true },
  });
  if (!registration) return { error: "Registration not found." };
  if (registration.status !== "PENDING") return { error: "This registration has already been decided." };

  const { tournament } = registration;
  const memberIds = registration.members.map((m) => m.userId);

  // Defensive — the front office already enforces this at submission, but
  // maxTeamSize could have been lowered by an admin after this was submitted.
  if (tournament.maxTeamSize !== null && memberIds.length > tournament.maxTeamSize) {
    return {
      error: `This roster has ${memberIds.length} players, over the tournament's max of ${tournament.maxTeamSize}.`,
    };
  }

  // Hard capacity check — re-verified here since other registrations may
  // have been approved since this one was submitted (the front office's own
  // check at submission time is only a soft, early-feedback check).
  if (tournament.capacity !== null) {
    const currentParticipants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId: tournament.id },
      select: { teamName: true },
    });
    const distinctTeams = new Set(currentParticipants.map((p) => p.teamName).filter((n): n is string => !!n));
    if (distinctTeams.size >= tournament.capacity) {
      return { error: "This tournament has already reached its maximum number of teams." };
    }
  }

  const alreadyParticipants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId: tournament.id, userId: { in: memberIds } },
    select: { userId: true },
  });
  if (alreadyParticipants.length > 0) {
    return { error: "One of this team's players is already registered for this tournament." };
  }

  const participantData = memberIds.map((userId) => ({
    tournamentId: tournament.id,
    userId,
    teamName: registration.teamName,
    teamTag: registration.teamTag,
    teamLogoUrl: registration.teamLogoUrl,
  }));

  // Random first-round bracket slot — sized off tournament.capacity when set
  // (the bracket's final shape is known up front), otherwise off however many
  // teams are approved so far (the bracket grows as more get approved). Only
  // ever grows, so a slot already taken by an earlier approval stays valid.
  const approvedRegistrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId: tournament.id, status: "APPROVED" },
    select: { bracketSlot: true },
  });
  const usedSlots = new Set(
    approvedRegistrations.map((r) => r.bracketSlot).filter((s): s is number => s !== null),
  );
  const size = bracketSize(tournament.capacity ?? approvedRegistrations.length + 1);
  const emptySlots = Array.from({ length: size }, (_, i) => i).filter((i) => !usedSlots.has(i));
  const bracketSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];

  if (tournament.entryType === "POINTS" && tournament.entryCost > 0) {
    const members = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, username: true, points: true },
    });
    const short = members.find((m) => m.points < tournament.entryCost);
    if (short) {
      return { error: `${short.username} doesn't have enough points (needs ${tournament.entryCost}).` };
    }

    await prisma.$transaction([
      ...members.map((m) =>
        prisma.user.update({ where: { id: m.id }, data: { points: { decrement: tournament.entryCost } } }),
      ),
      prisma.tournamentParticipant.createMany({ data: participantData }),
      prisma.tournamentRegistration.update({
        where: { id: registrationId },
        data: { status: "APPROVED", respondedAt: new Date(), bracketSlot },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.tournamentParticipant.createMany({ data: participantData }),
      prisma.tournamentRegistration.update({
        where: { id: registrationId },
        data: { status: "APPROVED", respondedAt: new Date(), bracketSlot },
      }),
    ]);
  }

  revalidatePath("/tournaments");
  return { success: true };
}

export async function rejectTournamentRegistration(
  registrationId: string,
  _prevState: RegistrationActionState,
  _formData: FormData,
): Promise<RegistrationActionState> {
  await requireBackofficeSession();

  const registration = await prisma.tournamentRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) return { error: "Registration not found." };
  if (registration.status !== "PENDING") return { error: "This registration has already been decided." };

  await prisma.tournamentRegistration.update({
    where: { id: registrationId },
    data: { status: "REJECTED", respondedAt: new Date() },
  });

  revalidatePath("/tournaments");
  return { success: true };
}
