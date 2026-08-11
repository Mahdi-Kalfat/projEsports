import Image from "next/image";

export type GameOption = { id: string; name: string };

export const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
export const FILE_FIELD_CLASS = `${FIELD_CLASS} file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary`;

export type EventFormDefaults = {
  title: string;
  startAtLocal: string;
  endAtLocal: string;
  gameId: string;
  type: string;
  location: string;
  capacity: number | "";
  description: string;
  additionalInfo: string;
};

export function EventFormFields({
  games,
  defaults,
  currentBackgroundImageUrl,
  currentLogoImageUrl,
}: {
  games: GameOption[];
  defaults?: EventFormDefaults;
  currentBackgroundImageUrl?: string | null;
  currentLogoImageUrl?: string | null;
}) {
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
        Ends (optional)
        <input
          type="datetime-local"
          name="endAt"
          defaultValue={defaults?.endAtLocal}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Type
        <select name="type" defaultValue={defaults?.type ?? "COMMUNITY"} className={FIELD_CLASS}>
          <option value="COMMUNITY">Community</option>
          <option value="NEWS">News</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="GIVEAWAY">Giveaway</option>
          <option value="ANNOUNCEMENT">Announcement</option>
          <option value="PARTNERSHIP">Partnership</option>
        </select>
      </label>

      <label className="text-xs text-muted">
        Game (optional)
        <select name="gameId" defaultValue={defaults?.gameId ?? ""} className={FIELD_CLASS}>
          <option value="">All games</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs text-muted">
        Location (optional)
        <input
          type="text"
          name="location"
          maxLength={160}
          placeholder="Discord, Online, venue…"
          defaultValue={defaults?.location}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Capacity (optional)
        <input
          type="number"
          name="capacity"
          min={0}
          placeholder="Unlimited"
          defaultValue={defaults?.capacity}
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
        Additional information
        <textarea
          name="additionalInfo"
          rows={3}
          maxLength={2000}
          defaultValue={defaults?.additionalInfo}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Background image
        {currentBackgroundImageUrl && (
          <span className="mt-1 flex items-center gap-2">
            <Image
              src={currentBackgroundImageUrl}
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
          name="backgroundImage"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={FILE_FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Logo / icon
        {currentLogoImageUrl && (
          <span className="mt-1 flex items-center gap-2">
            <Image
              src={currentLogoImageUrl}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="rounded object-contain"
            />
            <span className="text-xs text-muted">Current — pick a file to replace</span>
          </span>
        )}
        <input
          type="file"
          name="logoImage"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={FILE_FIELD_CLASS}
        />
      </label>
    </div>
  );
}
