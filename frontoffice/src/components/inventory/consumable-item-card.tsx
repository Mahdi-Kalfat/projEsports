"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Sparkles, Check } from "lucide-react";
import { useItem, type UseItemState } from "@/app/(app)/inventory/actions";
import { describeItemEffect, getItemEffectImage } from "@/lib/item-effects";
import type { ConsumableItemData } from "@/lib/inventory";

function UseButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Sparkles size={14} />
      {pending ? "Using…" : "Use"}
    </button>
  );
}

const initialState: UseItemState = {};

export function ConsumableItemCard({ entry, canUse }: { entry: ConsumableItemData; canUse: boolean }) {
  const boundAction = useItem.bind(null, entry.id);
  const [state, formAction] = useActionState(boundAction, initialState);
  const imageSrc = entry.item.imageUrl ?? getItemEffectImage(entry.item.effectType);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="hover-glow group h-full overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors hover:border-accent/50"
    >
      <div className="relative h-20 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            unoptimized
            className="object-contain p-3 transition duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles size={22} className="text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
        <span className="absolute right-2 top-2 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent ring-1 ring-accent/30 backdrop-blur-sm">
          {describeItemEffect(entry.item.effectType, entry.item.effectValue)}
        </span>
      </div>

      <div className="p-3">
        <h3 className="font-display text-sm font-bold text-foreground">{entry.item.name}</h3>
        {entry.item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{entry.item.description}</p>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
          <div>
            <p className="text-muted">Owned</p>
            <p className="font-semibold text-foreground">×{entry.quantity}</p>
          </div>
        </div>

        {canUse && (
          <div className="mt-2">
            {state.success ? (
              <p className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-success/15 py-1.5 text-xs font-medium text-success">
                <Check size={12} />
                {state.message ?? "Used!"}
              </p>
            ) : (
              <form action={formAction}>
                <UseButton />
                {state.error && <p className="mt-1.5 text-center text-xs text-primary-glow">{state.error}</p>}
              </form>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
