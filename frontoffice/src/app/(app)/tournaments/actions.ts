"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { isRestrictionActive } from "@/lib/restrictions";
import { syncUserBadges } from "@/lib/award-badges";
import { isTournamentFull } from "@/lib/tournament-capacity";
import { buildTeamTag } from "@/lib/tournament-registration";
import { saveUploadedImage } from "@/lib/uploads";

export type JoinTournamentState = { error?: string; success?: boolean };

// SOLO only — TEAM tournaments go through submitTournamentRegistration
// below (a pending request an admin approves), not this direct join.
export async function joinTournament(
  tournamentId: string,
  _prevState: JoinTournamentState,
  _formData: FormData,
): Promise<JoinTournamentState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const [user, tournament] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.tournament.findUnique({ where: { id: tournamentId } }),
  ]);
  if (!tournament) return { error: "Tournament not found." };

  // A blocked user can log in and use everything except join tournaments — see the
  // User model comment in prisma/schema.prisma.
  if (isRestrictionActive(user.blocked, user.blockedUntil)) {
    return { error: "Your account is currently blocked from joining tournaments." };
  }

  if (tournament.status !== "REGISTRATION") {
    return { error: "Registration is not open for this tournament." };
  }

  if (tournament.entryType === "MONEY") {
    return { error: "Money-entry tournaments aren't self-serve yet — contact an admin to register." };
  }

  if (tournament.participationType === "TEAM") {
    return { error: "Team tournaments are registered through the Participate form." };
  }

  const existing = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
  });
  if (existing) return { error: "You already joined this tournament." };

  const currentParticipants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    select: { teamName: true },
  });
  if (isTournamentFull("SOLO", currentParticipants, tournament.capacity)) {
    return { error: "This tournament is full." };
  }

  if (tournament.entryType === "POINTS" && tournament.entryCost > 0) {
    if (user.points < tournament.entryCost) {
      return { error: `You need ${tournament.entryCost} points to join — you have ${user.points}.` };
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { points: { decrement: tournament.entryCost } } }),
      prisma.tournamentParticipant.create({ data: { tournamentId, userId } }),
    ]);
  } else {
    await prisma.tournamentParticipant.create({ data: { tournamentId, userId } });
  }

  await syncUserBadges(userId);

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return { success: true };
}

export type UserSearchResult = { id: string; username: string; avatarUrl: string | null };

// Called directly from the registration modal's client component (not bound
// to a <form>) as the player types — excludes themself and anyone already
// on this tournament's roster (approved or pending), so results only ever
// show players who could actually be added.
export async function searchTournamentCandidates(
  tournamentId: string,
  query: string,
): Promise<UserSearchResult[]> {
  const session = await requireFrontOfficeSession();
  const viewerId = session!.user.id;

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const [participants, pendingMembers] = await Promise.all([
    prisma.tournamentParticipant.findMany({ where: { tournamentId }, select: { userId: true } }),
    prisma.tournamentRegistrationMember.findMany({
      where: { registration: { tournamentId, status: "PENDING" } },
      select: { userId: true },
    }),
  ]);
  const excludedIds = new Set([
    viewerId,
    ...participants.map((p) => p.userId),
    ...pendingMembers.map((m) => m.userId),
  ]);

  return prisma.user.findMany({
    where: {
      username: { contains: trimmed, mode: "insensitive" },
      id: { notIn: Array.from(excludedIds) },
    },
    select: { id: true, username: true, avatarUrl: true },
    take: 8,
    orderBy: { username: "asc" },
  });
}

// Best-effort display only — the authoritative tag is (re)computed inside
// submitTournamentRegistration at insert time, since another submission
// could land in between and take this exact sequence number.
export async function previewTeamTag(tournamentId: string): Promise<string> {
  await requireFrontOfficeSession();
  const [tournament, count] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: tournamentId }, select: { region: true } }),
    prisma.tournamentRegistration.count({ where: { tournamentId } }),
  ]);
  return buildTeamTag(tournament?.region ?? null, count + 1);
}

export type SubmitRegistrationState = { error?: string; success?: boolean };

// Creates a PENDING TournamentRegistration + one TournamentRegistrationMember
// per roster slot (the submitter is always included). No TournamentParticipant
// rows yet — those only get created if/when an admin approves this in the
// back office (see approveTournamentRegistration there).
export async function submitTournamentRegistration(
  tournamentId: string,
  _prevState: SubmitRegistrationState,
  formData: FormData,
): Promise<SubmitRegistrationState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const [user, tournament] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.tournament.findUnique({ where: { id: tournamentId } }),
  ]);
  if (!tournament) return { error: "Tournament not found." };
  if (tournament.participationType !== "TEAM") return { error: "This tournament isn't a team tournament." };
  if (tournament.status !== "REGISTRATION") {
    return { error: "Registration is not open for this tournament." };
  }
  if (isRestrictionActive(user.blocked, user.blockedUntil)) {
    return { error: "Your account is currently blocked from joining tournaments." };
  }

  const rawTeamName = formData.get("teamName");
  if (typeof rawTeamName !== "string" || !rawTeamName.trim()) return { error: "Enter a team name." };
  const teamName = rawTeamName.trim().slice(0, 60);

  const [existingParticipant, existingPending] = await Promise.all([
    prisma.tournamentParticipant.findUnique({ where: { tournamentId_userId: { tournamentId, userId } } }),
    prisma.tournamentRegistrationMember.findFirst({
      where: { userId, registration: { tournamentId, status: "PENDING" } },
    }),
  ]);
  if (existingParticipant) return { error: "You already joined this tournament." };
  if (existingPending) return { error: "You already have a pending registration for this tournament." };

  const rawMemberIds = formData.getAll("memberIds").filter((v): v is string => typeof v === "string");
  const memberIds = Array.from(new Set(rawMemberIds)).filter((id) => id !== userId);

  // +1 for the captain, who's always included but never appears in memberIds.
  if (tournament.maxTeamSize !== null && memberIds.length + 1 > tournament.maxTeamSize) {
    return { error: `This tournament allows at most ${tournament.maxTeamSize} players per team.` };
  }

  if (memberIds.length > 0) {
    const [validMembers, alreadyParticipants, alreadyPending] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: memberIds } }, select: { id: true } }),
      prisma.tournamentParticipant.findMany({
        where: { tournamentId, userId: { in: memberIds } },
        select: { userId: true },
      }),
      prisma.tournamentRegistrationMember.findMany({
        where: { userId: { in: memberIds }, registration: { tournamentId, status: "PENDING" } },
        select: { userId: true },
      }),
    ]);
    if (validMembers.length !== memberIds.length) {
      return { error: "One of the selected players no longer exists." };
    }
    if (alreadyParticipants.length > 0) {
      return { error: "One of the selected players is already registered for this tournament." };
    }
    if (alreadyPending.length > 0) {
      return { error: "One of the selected players already has a pending registration for this tournament." };
    }
  }

  // Soft check against approved teams — capacity is re-checked (hard) at
  // approval time, since multiple pending registrations can outnumber the
  // remaining slots and it's the admin's call which ones to approve.
  const approvedParticipants = await prisma.tournamentParticipant.findMany({
    where: { tournamentId },
    select: { teamName: true },
  });
  if (isTournamentFull("TEAM", approvedParticipants, tournament.capacity)) {
    return { error: "This tournament already has the maximum number of teams." };
  }

  const logo = formData.get("teamLogo");
  let teamLogoUrl: string | undefined;
  if (logo instanceof File) {
    const result = await saveUploadedImage(logo, "tournament-registrations");
    if (result && "error" in result) return { error: result.error };
    teamLogoUrl = result?.url;
  }

  const registrationCount = await prisma.tournamentRegistration.count({ where: { tournamentId } });
  const teamTag = buildTeamTag(tournament.region, registrationCount + 1);

  const registration = await prisma.tournamentRegistration.create({
    data: { tournamentId, teamName, teamTag, teamLogoUrl, submittedById: userId },
  });
  await prisma.tournamentRegistrationMember.createMany({
    data: [userId, ...memberIds].map((id) => ({ registrationId: registration.id, userId: id })),
  });

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}
