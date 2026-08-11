// Unlike backoffice's canAccessBackoffice (OWNER/ADMIN/MODERATOR only), the front
// office welcomes every role — it's gated on ban status, not role. Kept as its own
// function (not just an isRestrictionActive call at the call site) so the "who can
// use the front office" rule lives in one named place, same spirit as roles.ts.
export function canUseFrontOffice(banned: boolean, bannedUntil: Date | null): boolean {
  const isBanned = banned && (!bannedUntil || bannedUntil.getTime() > Date.now());
  return !isBanned;
}
