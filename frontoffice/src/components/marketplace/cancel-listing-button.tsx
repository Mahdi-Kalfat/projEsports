"use client";

import { useFormStatus } from "react-dom";
import { cancelListing } from "@/app/(app)/marketplace/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md border border-border py-2 text-xs font-medium uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Removing…" : "Remove listing"}
    </button>
  );
}

export function CancelListingButton({ listingId }: { listingId: string }) {
  return (
    <form action={cancelListing.bind(null, listingId)}>
      <SubmitButton />
    </form>
  );
}
