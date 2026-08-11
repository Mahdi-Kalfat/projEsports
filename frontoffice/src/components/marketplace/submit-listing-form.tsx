"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { submitListing, type SubmitListingState } from "@/app/(app)/marketplace/actions";

const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const FILE_FIELD_CLASS = `${FIELD_CLASS} file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary`;

type GameOption = { id: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Submitting…" : "Submit for review"}
    </button>
  );
}

const initialState: SubmitListingState = {};

export function SubmitListingForm({ games }: { games: GameOption[] }) {
  const [state, formAction] = useActionState(submitListing, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.push("/marketplace/mine");
  }, [state.success, router]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-muted sm:col-span-2">
        Title
        <input type="text" name="title" required maxLength={120} className={FIELD_CLASS} />
      </label>

      <label className="text-xs text-muted">
        Category
        <select name="category" defaultValue="OTHER" className={FIELD_CLASS}>
          <option value="ACCOUNT">Account</option>
          <option value="IN_GAME_ITEM">In-game item</option>
          <option value="BOOST_SERVICE">Boost / service</option>
          <option value="GEAR">Gear</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <label className="text-xs text-muted">
        Game (optional)
        <select name="gameId" defaultValue="" className={FIELD_CLASS}>
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
        <select name="priceType" defaultValue="MONEY" className={FIELD_CLASS}>
          <option value="FREE">Free</option>
          <option value="POINTS">Points</option>
          <option value="MONEY">Money (DT)</option>
        </select>
      </label>

      <label className="text-xs text-muted">
        Price
        <input type="number" name="price" min={0} defaultValue={0} className={FIELD_CLASS} />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Description
        <textarea name="description" rows={3} maxLength={2000} className={FIELD_CLASS} />
      </label>

      <label className="text-xs text-muted sm:col-span-2">
        Image
        <input
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={FILE_FIELD_CLASS}
        />
      </label>

      {state.error && <p className="text-xs text-primary-glow sm:col-span-2">{state.error}</p>}

      <div className="sm:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
