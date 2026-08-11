import { PROFILE_THEME_KEYS, PROFILE_THEMES } from "@/lib/profile-theme";

export function ThemePicker({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="flex gap-2.5">
      {PROFILE_THEME_KEYS.map((key) => {
        const theme = PROFILE_THEMES[key];
        return (
          <label key={key} className="cursor-pointer" title={theme.label}>
            <input
              type="radio"
              name="profileTheme"
              value={key}
              defaultChecked={defaultValue === key}
              className="peer sr-only"
            />
            <span
              className="block h-8 w-8 rounded-full border-2 border-transparent ring-offset-2 ring-offset-surface-raised transition peer-checked:border-foreground peer-checked:ring-2 peer-checked:ring-foreground/40"
              style={{ backgroundColor: theme.hex, boxShadow: `0 0 10px ${theme.glow}` }}
            />
          </label>
        );
      })}
    </div>
  );
}
