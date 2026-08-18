// Mirror of frontoffice's lib/profile-theme.ts hex values — used to color
// /profile's embed with the same accent the member picked for their own
// site profile, instead of one fixed color for everyone.
const PROFILE_THEME_COLORS: Record<string, number> = {
  CRIMSON: 0xff1e3c,
  CYAN: 0x00e5ff,
  VIOLET: 0xa855f7,
  EMERALD: 0x28ff8b,
  AMBER: 0xffc542,
};

export function getProfileThemeColor(theme: string): number {
  return PROFILE_THEME_COLORS[theme] ?? PROFILE_THEME_COLORS.CRIMSON;
}
