import Image from "next/image";

export type GameOption = { id: string; name: string };

export const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
export const FILE_FIELD_CLASS = `${FIELD_CLASS} file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary`;

export type ShopItemFormDefaults = {
  title: string;
  category: string;
  priceType: string;
  price: number;
  gameId: string;
  stock: number | "";
  description: string;
};

export function ShopItemFormFields({
  games,
  defaults,
  currentImageUrl,
}: {
  games: GameOption[];
  defaults?: ShopItemFormDefaults;
  currentImageUrl?: string | null;
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
        Category
        <select name="category" defaultValue={defaults?.category ?? "OTHER"} className={FIELD_CLASS}>
          <option value="AVATAR">Avatar</option>
          <option value="BADGE">Badge</option>
          <option value="BOOST">Boost</option>
          <option value="VOUCHER">Voucher</option>
          <option value="MERCH">Merch</option>
          <option value="OTHER">Other</option>
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
        Price type
        <select name="priceType" defaultValue={defaults?.priceType ?? "POINTS"} className={FIELD_CLASS}>
          <option value="FREE">Free</option>
          <option value="POINTS">Points</option>
          <option value="MONEY">Money (DT)</option>
        </select>
      </label>

      <label className="text-xs text-muted">
        Price
        <input
          type="number"
          name="price"
          min={0}
          defaultValue={defaults?.price ?? 0}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Stock (optional)
        <input
          type="number"
          name="stock"
          min={0}
          placeholder="Unlimited"
          defaultValue={defaults?.stock}
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
