import Image from "next/image";

export type GameOption = { id: string; name: string };

export const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
export const FILE_FIELD_CLASS = `${FIELD_CLASS} file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary`;

export type TournamentFormDefaults = {
  title: string;
  startAtLocal: string;
  gameId: string;
  description: string;
  additionalInfo: string;
  prizePool: number;
  entryCost: number;
  participationType: string;
};

export function TournamentFormFields({
  games,
  defaults,
  currentBackgroundImageUrl,
  currentLogoImageUrl,
}: {
  games: GameOption[];
  defaults?: TournamentFormDefaults;
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
        Date &amp; time
        <input
          type="datetime-local"
          name="startAt"
          required
          defaultValue={defaults?.startAtLocal}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Game
        <select name="gameId" required defaultValue={defaults?.gameId ?? ""} className={FIELD_CLASS}>
          <option value="" disabled>
            Select a game
          </option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
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

      <label className="text-xs text-muted">
        Prize pool (DT)
        <input
          type="number"
          name="prizePool"
          min={0}
          defaultValue={defaults?.prizePool ?? 0}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Price to participate (DT)
        <input
          type="number"
          name="entryCost"
          min={0}
          defaultValue={defaults?.entryCost ?? 0}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Who can join
        <select
          name="participationType"
          defaultValue={defaults?.participationType ?? "SOLO"}
          className={FIELD_CLASS}
        >
          <option value="SOLO">Single player</option>
          <option value="TEAM">Teams only</option>
        </select>
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
        Game logo
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
