// Deliberately not importing the `Role` enum from the generated Prisma client here:
// this module is imported by proxy.ts (Next's middleware), and pulling in the Prisma
// client there drags its query-engine binary lookup into the middleware bundle.
export const BACKOFFICE_ROLES = ["OWNER", "ADMIN", "MODERATOR"] as const;

export function canAccessBackoffice(role: string | null | undefined): boolean {
  return !!role && (BACKOFFICE_ROLES as readonly string[]).includes(role);
}
