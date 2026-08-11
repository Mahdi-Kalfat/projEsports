export type ProfileThemeKey = "CRIMSON" | "CYAN" | "VIOLET" | "EMERALD" | "AMBER";

export type ProfileThemeDef = {
  label: string;
  hex: string;
  glow: string;
};

// Tailwind can't generate classes from a runtime string, so these are applied via
// inline style (see ProfileHeader) rather than dynamic class names.
export const PROFILE_THEMES: Record<ProfileThemeKey, ProfileThemeDef> = {
  CRIMSON: { label: "Crimson", hex: "#ff1e3c", glow: "rgba(255,30,60,0.45)" },
  CYAN: { label: "Cyan", hex: "#00e5ff", glow: "rgba(0,229,255,0.4)" },
  VIOLET: { label: "Violet", hex: "#a855f7", glow: "rgba(168,85,247,0.4)" },
  EMERALD: { label: "Emerald", hex: "#28ff8b", glow: "rgba(40,255,139,0.4)" },
  AMBER: { label: "Amber", hex: "#ffc542", glow: "rgba(255,197,66,0.4)" },
};

export const PROFILE_THEME_KEYS = Object.keys(PROFILE_THEMES) as ProfileThemeKey[];

export function getProfileTheme(theme: string): ProfileThemeDef {
  return PROFILE_THEMES[theme as ProfileThemeKey] ?? PROFILE_THEMES.CRIMSON;
}
