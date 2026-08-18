"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ShoppingCart } from "lucide-react";
import { buyShopItem, type BuyShopItemState } from "@/app/(app)/shop/actions";

function BuySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ShoppingCart size={14} />
      {pending ? "Requesting…" : "Buy"}
    </button>
  );
}

const initialState: BuyShopItemState = {};

// Submitting either opens an admin-approval ticket or grants the item right
// away, depending on the listing's needsConfirmation flag — either way the
// server action redirects to wherever that outcome lives (see shop/actions.ts's
// buyShopItem).
export function BuyShopItemButton({ shopItemId }: { shopItemId: string }) {
  const boundAction = buyShopItem.bind(null, shopItemId);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction}>
      <BuySubmitButton />
      {state.error && <p className="mt-1.5 text-center text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}
