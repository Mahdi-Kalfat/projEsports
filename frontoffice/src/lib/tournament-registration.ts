// Auto-generated team tag for a tournament registration — region prefix
// (defaults to "GEN" when the tournament has none set) plus a zero-padded
// sequence number, e.g. region "EUW" + 3rd registration submitted -> "EUW003".
// The sequence counts *all* registrations ever submitted for the tournament
// (any status), not just approved ones, so a tag is never reused even if an
// earlier registration was rejected.
export function buildTeamTag(region: string | null, sequence: number): string {
  const prefix = (region?.trim() || "GEN").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "GEN";
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}
