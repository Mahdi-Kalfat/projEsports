"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Users, X } from "lucide-react";
import { deleteEvent, setEventStatus } from "@/app/(app)/events/actions";
import { STATUS_LABEL, TYPE_LABEL } from "./event-card";
import { EditEventModal } from "./edit-event-modal";
import type { EventFormDefaults, GameOption } from "./event-form-fields";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DRAFT", label: STATUS_LABEL.DRAFT },
  { value: "SCHEDULED", label: STATUS_LABEL.SCHEDULED },
  { value: "LIVE", label: STATUS_LABEL.LIVE },
  { value: "COMPLETED", label: STATUS_LABEL.COMPLETED },
  { value: "ARCHIVED", label: STATUS_LABEL.ARCHIVED },
  { value: "CANCELLED", label: STATUS_LABEL.CANCELLED },
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

function StatusSelect({ eventId, status }: { eventId: string; status: string }) {
  return (
    <form action={setEventStatus.bind(null, eventId)}>
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
  eventId,
  title,
  onClose,
}: {
  eventId: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />

      <form
        action={deleteEvent.bind(null, eventId)}
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

export type AttendeeEntry = {
  id: string;
  username: string;
  joinedLabel: string;
};

export type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  additionalInfo: string | null;
  status: string;
  type: string;
  gameId: string | null;
  gameName: string | null;
  location: string | null;
  capacity: number | null;
  backgroundImageUrl: string | null;
  logoImageUrl: string | null;
  startAtLabel: string;
  startAtLocal: string;
  endAtLabel: string | null;
  endAtLocal: string;
};

export function EventDetailModal({
  event,
  games,
  attendees,
  closeHref,
}: {
  event: EventDetail;
  games: GameOption[];
  attendees: AttendeeEntry[];
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

  const editDefaults: EventFormDefaults = {
    title: event.title,
    startAtLocal: event.startAtLocal,
    endAtLocal: event.endAtLocal,
    gameId: event.gameId ?? "",
    type: event.type,
    location: event.location ?? "",
    capacity: event.capacity ?? "",
    description: event.description ?? "",
    additionalInfo: event.additionalInfo ?? "",
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
            {event.logoImageUrl && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                <Image
                  src={event.logoImageUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="object-contain"
                />
              </span>
            )}
            <div>
              <h2 className="font-display text-base font-bold text-foreground">{event.title}</h2>
              <p className="text-xs text-muted">{event.gameName ?? "All games"}</p>
            </div>
          </div>
          <Link href={closeHref} aria-label="Close" className="text-muted transition hover:text-foreground">
            <X size={20} />
          </Link>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <InfoField label="Starts" value={event.startAtLabel} />
          <InfoField label="Ends" value={event.endAtLabel ?? "—"} />
          <InfoField label="Type" value={TYPE_LABEL[event.type] ?? event.type} />
          <InfoField label="Location" value={event.location ?? "TBA"} />
          <InfoField
            label="Capacity"
            value={event.capacity ? `${event.capacity} spots` : "Unlimited"}
          />
        </dl>

        {event.description && (
          <p className="mt-3 text-sm text-muted">{event.description}</p>
        )}
        {event.additionalInfo && (
          <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Additional information</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{event.additionalInfo}</p>
          </div>
        )}

        <div className="mt-4 max-w-[10rem]">
          <StatusSelect eventId={event.id} status={event.status} />
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Users size={14} />
            Attending ({attendees.length})
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto">
            {attendees.length === 0 ? (
              <p className="text-sm text-muted">No one has RSVP&apos;d yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {attendees.map((attendee) => (
                  <li
                    key={attendee.id}
                    className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <p className="font-medium text-foreground">{attendee.username}</p>
                    <span className="text-xs text-muted">{attendee.joinedLabel}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
        <EditEventModal
          eventId={event.id}
          games={games}
          defaults={editDefaults}
          currentBackgroundImageUrl={event.backgroundImageUrl}
          currentLogoImageUrl={event.logoImageUrl}
          onClose={() => setEditing(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteConfirmPrompt
          eventId={event.id}
          title={event.title}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
