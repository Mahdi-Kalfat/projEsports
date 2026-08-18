"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { upsertRankTier, resetRankTier, type RankTierActionState } from "@/app/(app)/ranks/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function ResetButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Reset to default"
      title="Reset to default"
      className="text-muted transition hover:text-primary disabled:opacity-50"
    >
      <RotateCcw size={16} />
    </button>
  );
}

const initialState: RankTierActionState = {};

export function RankTierRow({
  tier,
  defaultName,
  defaultImage,
  name,
  imageUrl,
}: {
  tier: number;
  defaultName: string;
  defaultImage: string;
  name: string | null;
  imageUrl: string | null;
}) {
  const boundUpsert = upsertRankTier.bind(null, tier);
  const [state, formAction] = useActionState(boundUpsert, initialState);
  const effectiveImage = imageUrl ?? defaultImage;
  const isCustomized = name !== null || imageUrl !== null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-raised">
        <Image src={effectiveImage} alt="" width={44} height={44} unoptimized className="object-contain" />
      </span>

      <form action={formAction} className="flex flex-1 flex-wrap items-center gap-2">
        <label className="text-xs text-muted">
          Name
          <input
            key={name ?? defaultName}
            type="text"
            name="name"
            maxLength={40}
            placeholder={defaultName}
            defaultValue={name ?? ""}
            className="mt-1 block w-36 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="text-xs text-muted">
          Image
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="mt-1 block w-48 text-xs text-muted file:mr-2 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary"
          />
        </label>
        <SaveButton />
        {state.error && <span className="text-xs text-primary-glow">{state.error}</span>}
        {state.success && <span className="text-xs text-success">Saved</span>}
      </form>

      {isCustomized && (
        <form action={resetRankTier.bind(null, tier)}>
          <ResetButton />
        </form>
      )}
    </div>
  );
}
