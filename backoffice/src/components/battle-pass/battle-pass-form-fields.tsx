export const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

export type BattlePassFormDefaults = {
  title: string;
  description: string;
  premiumPointsCost: number;
  startAtLocal: string;
  endAtLocal: string;
};

export function BattlePassFormFields({ defaults }: { defaults?: BattlePassFormDefaults }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-muted sm:col-span-2">
        Title
        <input
          type="text"
          name="title"
          required
          maxLength={120}
          defaultValue={defaults?.title}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Starts
        <input
          type="datetime-local"
          name="startAt"
          required
          defaultValue={defaults?.startAtLocal}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Ends
        <input
          type="datetime-local"
          name="endAt"
          required
          defaultValue={defaults?.endAtLocal}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Premium unlock cost (points)
        <input
          type="number"
          name="premiumPointsCost"
          min={0}
          defaultValue={defaults?.premiumPointsCost ?? 0}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Description (optional)
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={defaults?.description}
          className={FIELD_CLASS}
        />
      </label>
    </div>
  );
}
