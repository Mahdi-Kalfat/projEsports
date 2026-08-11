"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { deleteListing, setListingStatus } from "@/app/(app)/marketplace/actions";
import { formatPriceByType } from "@/lib/format";
import { CATEGORY_LABEL, STATUS_LABEL } from "./listing-card";
import { EditListingModal } from "./edit-listing-modal";
import type { GameOption, ListingFormDefaults } from "./listing-form-fields";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "PENDING", label: STATUS_LABEL.PENDING },
  { value: "APPROVED", label: STATUS_LABEL.APPROVED },
  { value: "DECLINED", label: STATUS_LABEL.DECLINED },
  { value: "ARCHIVED", label: STATUS_LABEL.ARCHIVED },
  // Not admin-assignable (see ASSIGNABLE_STATUSES in actions.ts) — only shown
  // here so the dropdown renders correctly once the front office's buy flow
  // has sold a listing, instead of appearing blank.
  { value: "SOLD", label: STATUS_LABEL.SOLD },
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

function ReviewSubmitButton({
  label,
  icon,
  tone,
}: {
  label: string;
  icon: React.ReactNode;
  tone: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${tone}`}
    >
      {icon}
      {label}
    </button>
  );
}

function PendingReview({ listingId }: { listingId: string }) {
  return (
    <div className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-warning">Needs review</p>
      <div className="mt-2 flex gap-2">
        <form action={setListingStatus.bind(null, listingId)}>
          <input type="hidden" name="status" value="APPROVED" />
          <ReviewSubmitButton
            label="Approve"
            icon={<Check size={14} />}
            tone="bg-success/15 text-success hover:bg-success/25"
          />
        </form>
        <form action={setListingStatus.bind(null, listingId)}>
          <input type="hidden" name="status" value="DECLINED" />
          <ReviewSubmitButton
            label="Decline"
            icon={<X size={14} />}
            tone="bg-primary/15 text-primary hover:bg-primary/25"
          />
        </form>
      </div>
    </div>
  );
}

function StatusSelect({ listingId, status }: { listingId: string; status: string }) {
  return (
    <form action={setListingStatus.bind(null, listingId)}>
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
  listingId,
  title,
  onClose,
}: {
  listingId: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />

      <form
        action={deleteListing.bind(null, listingId)}
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

export type ListingDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string;
  priceType: string;
  price: number;
  gameId: string | null;
  gameName: string | null;
  sellerUsername: string;
  imageUrl: string | null;
};

export function ListingDetailModal({
  listing,
  games,
  closeHref,
}: {
  listing: ListingDetail;
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

  const editDefaults: ListingFormDefaults = {
    title: listing.title,
    category: listing.category,
    priceType: listing.priceType,
    price: listing.price,
    gameId: listing.gameId ?? "",
    description: listing.description ?? "",
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
            {listing.imageUrl && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                <Image
                  src={listing.imageUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="object-cover"
                />
              </span>
            )}
            <div>
              <h2 className="font-display text-base font-bold text-foreground">{listing.title}</h2>
              <p className="text-xs text-muted">{listing.gameName ?? "All games"}</p>
            </div>
          </div>
          <Link href={closeHref} aria-label="Close" className="text-muted transition hover:text-foreground">
            <X size={20} />
          </Link>
        </div>

        {listing.status === "PENDING" && <PendingReview listingId={listing.id} />}

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <InfoField label="Category" value={CATEGORY_LABEL[listing.category] ?? listing.category} />
          <InfoField label="Price" value={formatPriceByType(listing.priceType, listing.price)} />
          <InfoField label="Seller" value={listing.sellerUsername} />
          <InfoField label="Game" value={listing.gameName ?? "All games"} />
        </dl>

        {listing.description && <p className="mt-3 text-sm text-muted">{listing.description}</p>}

        <div className="mt-4 max-w-[10rem]">
          <StatusSelect listingId={listing.id} status={listing.status} />
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
        <EditListingModal
          listingId={listing.id}
          games={games}
          defaults={editDefaults}
          currentImageUrl={listing.imageUrl}
          onClose={() => setEditing(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteConfirmPrompt listingId={listing.id} title={listing.title} onClose={() => setConfirmingDelete(false)} />
      )}
    </div>
  );
}
