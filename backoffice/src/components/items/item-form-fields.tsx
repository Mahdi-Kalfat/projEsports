import Image from "next/image";

export const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
export const FILE_FIELD_CLASS = `${FIELD_CLASS} file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary`;

export type ItemFormDefaults = {
  name: string;
  effectType: string;
  effectValue: number;
  description: string;
};

export function ItemFormFields({
  defaults,
  currentImageUrl,
}: {
  defaults?: ItemFormDefaults;
  currentImageUrl?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-muted sm:col-span-2">
        Name
        <input
          type="text"
          name="name"
          required
          maxLength={120}
          defaultValue={defaults?.name}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Effect
        <select name="effectType" defaultValue={defaults?.effectType ?? "XP_BOOST"} className={FIELD_CLASS}>
          <option value="XP_BOOST">XP Boost</option>
          <option value="POINTS_BOOST">Points Boost</option>
          <option value="CC_GRANT">CC Grant</option>
          <option value="POINTS_GRANT">Points Grant</option>
        </select>
      </label>

      <label className="text-xs text-muted">
        Effect value (% for boosts, flat amount for CC/Points Grant)
        <input
          type="number"
          name="effectValue"
          min={1}
          max={100_000}
          required
          defaultValue={defaults?.effectValue ?? 25}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Description
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          defaultValue={defaults?.description}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Image
        {currentImageUrl && (
          <span className="mt-1 flex items-center gap-2">
            <Image
              src={currentImageUrl}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="rounded object-cover"
            />
            <span className="text-xs text-muted">Current — pick a file to replace</span>
          </span>
        )}
        <input
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={FILE_FIELD_CLASS}
        />
      </label>
    </div>
  );
}
