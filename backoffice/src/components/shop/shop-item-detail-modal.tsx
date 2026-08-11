"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { deleteShopItem, setShopItemStatus } from "@/app/(app)/shop/actions";
import { formatPriceByType } from "@/lib/format";
import { CATEGORY_LABEL, STATUS_LABEL } from "./shop-item-card";
import { EditShopItemModal } from "./edit-shop-item-modal";
import type { GameOption, ShopItemFormDefaults } from "./shop-item-form-fields";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DRAFT", label: STATUS_LABEL.DRAFT },
  { value: "ACTIVE", label: STATUS_LABEL.ACTIVE },
  { value: "ARCHIVED", label: STATUS_LABEL.ARCHIVED },
];

const SELECT_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary";

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function StatusSelect({ itemId, status }: { itemId: string; status: string }) {
  return (
    <form action={setShopItemStatus.bind(null, itemId)}>
      <label className="text-xs text-muted">
        Status
        <select
          key={status}
          name="status"
          defaultValue={status}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={SELECT_CLASS}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}

function DeleteConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

function DeleteConfirmPrompt({
  itemId,
  title,
  onClose,
}: {
  itemId: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />

      <form
        action={deleteShopItem.bind(null, itemId)}
        className="relative z-10 w-full max-w-xs rounded-xl border border-border bg-surface-raised p-5 shadow-2xl"
      >
        <h3 className="font-display text-sm font-semibold text-foreground">Delete &ldquo;{title}&rdquo;?</h3>
        <p className="mt-1 text-xs text-muted">This can&apos;t be undone.</p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <DeleteConfirmButton />
        </div>
      </form>
    </div>
  );
}

export type ShopItemDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string;
  priceType: string;
  price: number;
  stock: number | null;
  gameId: string | null;
  gameName: string | null;
  imageUrl: string | null;
};

export function ShopItemDetailModal({
  item,
  games,
  closeHref,
}: {
  item: ShopItemDetail;
  games: GameOption[];
  closeHref: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (confirmingDelete) {
        setConfirmingDelete(false);
      } else if (editing) {
        setEditing(false);
      } else {
        router.push(closeHref);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmingDelete, editing, closeHref, router]);

  const editDefaults: ShopItemFormDefaults = {
    title: item.title,
    category: item.category,
    priceType: item.priceType,
    price: item.price,
    gameId: item.gameId ?? "",
    stock: item.stock ?? "",
    description: item.description ?? "",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={() => router.push(closeHref)}
        className="absolute inset-0 bg-black/70"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {item.imageUrl && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                <Image
                  src={item.imageUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="object-cover"
                />
              </span>
            )}
            <div>
              <h2 className="font-display text-base font-bold text-foreground">{item.title}</h2>
              <p className="text-xs text-muted">{item.gameName ?? "All games"}</p>
            </div>
          </div>
          <Link href={closeHref} aria-label="Close" className="text-muted transition hover:text-foreground">
            <X size={20} />
          </Link>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <InfoField label="Category" value={CATEGORY_LABEL[item.category] ?? item.category} />
          <InfoField label="Price" value={formatPriceByType(item.priceType, item.price)} />
          <InfoField
            label="Stock"
            value={item.stock === null ? "Unlimited" : item.stock <= 0 ? "Sold out" : `${item.stock} left`}
          />
          <InfoField label="Game" value={item.gameName ?? "All games"} />
        </dl>

        {item.description && <p className="mt-3 text-sm text-muted">{item.description}</p>}

        <div className="mt-4 max-w-[10rem]">
          <StatusSelect itemId={item.id} status={item.status} />
        </div>

        <div className="mt-5 flex gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <EditShopItemModal
          itemId={item.id}
          games={games}
          defaults={editDefaults}
          currentImageUrl={item.imageUrl}
          onClose={() => setEditing(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteConfirmPrompt itemId={item.id} title={item.title} onClose={() => setConfirmingDelete(false)} />
      )}
    </div>
  );
}
