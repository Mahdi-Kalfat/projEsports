import Image from "next/image";

export const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
export const FILE_FIELD_CLASS = `${FIELD_CLASS} file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary`;

export type ClanFormDefaults = {
  name: string;
  tag: string;
  description: string;
  visibility: string;
  minLevel: number;
  maxMembers: number;
};

export function ClanFormFields({
  defaults,
  currentLogoUrl,
  currentBannerUrl,
}: {
  defaults?: ClanFormDefaults;
  currentLogoUrl?: string | null;
  currentBannerUrl?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-muted">
        Clan name
        <input
          type="text"
          name="name"
          required
          maxLength={40}
          placeholder="Night Wolves"
          defaultValue={defaults?.name}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Tag
        <input
          type="text"
          name="tag"
          required
          maxLength={6}
          placeholder="NWLF"
          defaultValue={defaults?.tag}
          className={`${FIELD_CLASS} uppercase`}
        />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Description
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          placeholder="What's this clan about?"
          defaultValue={defaults?.description}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Visibility
        <select name="visibility" defaultValue={defaults?.visibility ?? "PUBLIC"} className={FIELD_CLASS}>
          <option value="PUBLIC">Public — anyone can join</option>
          <option value="PRIVATE">Private — join by request</option>
        </select>
      </label>

      <label className="text-xs text-muted">
        Minimum level to join
        <input
          type="number"
          name="minLevel"
          min={1}
          max={999}
          defaultValue={defaults?.minLevel ?? 1}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Max members
        <input
          type="number"
          name="maxMembers"
          min={2}
          max={500}
          defaultValue={defaults?.maxMembers ?? 20}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Logo
        {currentLogoUrl && (
          <span className="mt-1 flex items-center gap-2">
            <Image src={currentLogoUrl} alt="" width={36} height={36} unoptimized className="rounded object-contain" />
            <span className="text-xs text-muted">Current — pick a file to replace</span>
          </span>
        )}
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={FILE_FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Banner
        {currentBannerUrl && (
          <span className="mt-1 flex items-center gap-2">
            <Image src={currentBannerUrl} alt="" width={36} height={36} unoptimized className="rounded object-cover" />
            <span className="text-xs text-muted">Current — pick a file to replace</span>
          </span>
        )}
        <input
          type="file"
          name="banner"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={FILE_FIELD_CLASS}
        />
      </label>
    </div>
  );
}
