// Mirror of frontoffice's lib/bracket.ts sizing function — only what
// approveTournamentRegistration needs to pick a random first-round slot.
// The full layout/rendering logic lives in the front office only.

export function bracketSize(teamCount: number): number {
  const n = Math.max(teamCount, 2);
  return Math.pow(2, Math.ceil(Math.log2(n)));
}
