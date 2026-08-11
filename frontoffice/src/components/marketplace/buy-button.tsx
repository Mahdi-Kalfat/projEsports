"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ShoppingBag, Check } from "lucide-react";
import { buyListing, type BuyListingState } from "@/app/(app)/marketplace/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ShoppingBag size={16} />
      {pending ? "Buying…" : "Buy now"}
    </button>
  );
}

const initialState: BuyListingState = {};

export function BuyButton({
  listingId,
  isOwn,
  priceType,
}: {
  listingId: string;
  isOwn: boolean;
  priceType: string;
}) {
  const boundAction = buyListing.bind(null, listingId);
  const [state, formAction] = useActionState(boundAction, initialState);

  if (isOwn) return null;

  if (state.success) {
    return (
      <p className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-success/15 py-2.5 text-sm font-medium text-success">
        <Check size={16} />
        Purchased!
      </p>
    );
  }

  if (priceType === "MONEY") {
    return <p className="text-center text-xs text-muted">Contact the seller directly to arrange payment.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <SubmitButton />
      {state.error && <p className="text-center text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}
