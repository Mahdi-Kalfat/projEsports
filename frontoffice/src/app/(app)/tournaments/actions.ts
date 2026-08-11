"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { isRestrictionActive } from "@/lib/restrictions";
import { syncUserBadges } from "@/lib/award-badges";

export type JoinTournamentState = { error?: string; success?: boolean };

export async function joinTournament(
  tournamentId: string,
  _prevState: JoinTournamentState,
  formData: FormData,
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

  const existing = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
  });
  if (existing) return { error: "You already joined this tournament." };

  let teamName: string | undefined;
  if (tournament.participationType === "TEAM") {
    const raw = formData.get("teamName");
    if (typeof raw !== "string" || !raw.trim()) return { error: "Enter a team name." };
    teamName = raw.trim();
  }

  if (tournament.entryType === "POINTS" && tournament.entryCost > 0) {
    if (user.points < tournament.entryCost) {
      return { error: `You need ${tournament.entryCost} points to join — you have ${user.points}.` };
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { points: { decrement: tournament.entryCost } } }),
      prisma.tournamentParticipant.create({ data: { tournamentId, userId, teamName } }),
    ]);
  } else {
    await prisma.tournamentParticipant.create({ data: { tournamentId, userId, teamName } });
  }

  await syncUserBadges(userId);

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return { success: true };
}
