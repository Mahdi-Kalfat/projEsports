// TEAM tournaments have no real Team entity — each roster member registers
// their own TournamentParticipant row and types the same teamName (see
// joinTournament in tournaments/actions.ts) — so "how many are registered"
// means something different per participationType: total rows for SOLO,
// distinct team names for TEAM. Centralized here so the join action and every
// display (detail page, cards, homepage widgets) agree on the same numbers.

export type ParticipantTeamName = { teamName: string | null };

export function distinctTeamNames(participants: ParticipantTeamName[]): Set<string> {
  return new Set(participants.map((p) => p.teamName).filter((name): name is string => !!name));
}

export function registeredCount(participationType: string, participants: ParticipantTeamName[]): number {
  if (participationType === "TEAM") return distinctTeamNames(participants).size;
  return participants.length;
}

// `joiningTeamName` (TEAM only): a player adding themselves to an *existing*
// registered team is never blocked by the cap, even once it's reached — the
// cap limits how many distinct teams can register, not how many players per
// team.
export function isTournamentFull(
  participationType: string,
  participants: ParticipantTeamName[],
  capacity: number | null,
  joiningTeamName?: string,
): boolean {
  if (capacity === null) return false;
  if (participationType === "TEAM") {
    const teams = distinctTeamNames(participants);
    if (joiningTeamName && teams.has(joiningTeamName)) return false;
    return teams.size >= capacity;
  }
  return participants.length >= capacity;
}

export function formatCapacityLabel(
  participationType: string,
  registered: number,
  capacity: number | null,
): string {
  const noun = participationType === "TEAM" ? "teams" : "players";
  return capacity !== null ? `${registered}/${capacity} ${noun}` : `${registered} ${noun}`;
}
