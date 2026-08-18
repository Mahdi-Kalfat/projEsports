// Mirrors frontoffice's lib/tournament-capacity.ts (display-only side — this
// app doesn't enforce the cap, the front office's joinTournament does). TEAM
// tournaments have no real Team entity, so "registered" means distinct team
// names among participants, not row count — see TournamentParticipant.teamName.

export type ParticipantTeamName = { teamName: string | null };

export function registeredCount(participationType: string, participants: ParticipantTeamName[]): number {
  if (participationType === "TEAM") {
    return new Set(participants.map((p) => p.teamName).filter((name): name is string => !!name)).size;
  }
  return participants.length;
}

export function formatCapacityLabel(
  participationType: string,
  registered: number,
  capacity: number | null,
): string {
  const noun = participationType === "TEAM" ? "teams" : "players";
  return capacity !== null ? `${registered}/${capacity} ${noun}` : `${registered} ${noun}`;
}
