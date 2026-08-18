"use client";

import { useEffect, useState, useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, StickyNote, X } from "lucide-react";
import {
  addNote,
  applyRestriction,
  grantItem,
  liftRestriction,
  setRole,
  setSubRole,
  updateEconomy,
  type EconomyActionState,
  type GrantItemState,
  type NoteActionState,
  type RestrictionActionState,
} from "@/app/(app)/users/actions";
import { getRank } from "@/lib/rank";
import { describeItemEffect } from "@/lib/item-effects";
import { RESTRICTION_LABELS, type RestrictionKind } from "@/lib/restrictions";

export type UserDetail = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  subRoles: string[];
  level: number;
  points: number;
  ccCoins: number;
  xp: number;
  banned: boolean;
  bannedUntilLabel: string | null;
  blocked: boolean;
  blockedUntilLabel: string | null;
  marketBlocked: boolean;
  marketBlockedUntilLabel: string | null;
  shopBlocked: boolean;
  shopBlockedUntilLabel: string | null;
  joinedLabel: string;
  lastLoginLabel: string;
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function Badge({ tone, children }: { tone: "danger" | "warning" | "success"; children: ReactNode }) {
  const toneClass =
    tone === "danger"
      ? "bg-primary/15 text-primary"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-success/15 text-success";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>{children}</span>;
}

function RestrictionStatusRow({
  tone,
  label,
  untilLabel,
}: {
  tone: "danger" | "warning";
  label: string;
  untilLabel: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      <Badge tone={tone}>{label}</Badge>
      {untilLabel && <span className="text-xs text-muted">until {untilLabel}</span>}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon mt-3 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

const SELECT_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary";

function RoleSelect({ userId, role }: { userId: string; role: string }) {
  return (
    <form action={setRole.bind(null, userId)} className="flex-1">
      <label className="text-xs text-muted">
        Role
        <select
          key={role}
          name="role"
          defaultValue={role}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={SELECT_CLASS}
        >
          <option value="ADMIN">Admin</option>
          <option value="MODERATOR">Moderator</option>
          <option value="USER">User</option>
        </select>
      </label>
    </form>
  );
}

function SubRoleSelect({ userId, subRoles }: { userId: string; subRoles: string[] }) {
  return (
    <form action={setSubRole.bind(null, userId)} className="flex-1">
      <label className="text-xs text-muted">
        Sub-role
        <select
          key={subRoles[0] ?? "none"}
          name="subRole"
          defaultValue={subRoles[0] ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={SELECT_CLASS}
        >
          <option value="">None</option>
          <option value="TRUSTED">Trusted</option>
          <option value="COMMENTOR">Commentor</option>
        </select>
      </label>
    </form>
  );
}

function EconomyForm({
  userId,
  points,
  level,
  xp,
}: {
  userId: string;
  points: number;
  level: number;
  xp: number;
}) {
  const boundAction = updateEconomy.bind(null, userId);
  const [state, formAction] = useActionState<EconomyActionState, FormData>(boundAction, {});

  return (
    <form action={formAction} className="mt-5 border-t border-border pt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Economy</p>
      <div className="mt-2 flex gap-3">
        <label className="flex-1 text-xs text-muted">
          Points
          <input
            key={points}
            type="number"
            name="points"
            min={0}
            defaultValue={points}
            className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex-1 text-xs text-muted">
          Level
          <input
            key={level}
            type="number"
            name="level"
            min={1}
            defaultValue={level}
            className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="flex-1 text-xs text-muted">
          XP
          <input
            key={xp}
            type="number"
            name="xp"
            min={0}
            defaultValue={xp}
            className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        XP past a level&apos;s requirement automatically carries into level-ups on save (see Level settings).
      </p>

      {state.error && <p className="mt-2 text-xs text-primary-glow">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-success">Saved.</p>}

      <SaveButton />
    </form>
  );
}

export type ItemOption = { id: string; name: string; effectType: string; effectValue: number };
export type GrantedItemEntry = {
  id: string;
  name: string;
  effectType: string;
  effectValue: number;
  quantity: number;
};

function GrantItemForm({ userId, items }: { userId: string; items: ItemOption[] }) {
  const boundAction = grantItem.bind(null, userId);
  const [state, formAction] = useActionState<GrantItemState, FormData>(boundAction, {});

  if (items.length === 0) {
    return (
      <p className="mt-5 border-t border-border pt-4 text-xs text-muted">
        No active items to grant — create one on the Items page first.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-5 border-t border-border pt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Grant item</p>
      <div className="mt-2 flex gap-3">
        <label className="flex-2 text-xs text-muted">
          Item
          <select
            name="itemId"
            defaultValue={items[0]?.id}
            className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({describeItemEffect(item.effectType, item.effectValue)})
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-xs text-muted">
          Quantity
          <input
            type="number"
            name="quantity"
            min={1}
            max={99}
            defaultValue={1}
            className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </div>

      {state.error && <p className="mt-2 text-xs text-primary-glow">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-success">Granted.</p>}

      <SaveButton />
    </form>
  );
}

function GrantedItemsList({ entries }: { entries: GrantedItemEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Inventory</p>
      <ul className="flex flex-col gap-1">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{entry.name}</span>
            <span className="text-xs text-muted">
              ×{entry.quantity} · {describeItemEffect(entry.effectType, entry.effectValue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LiftButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function RestrictionButton({
  kind,
  userId,
  active,
  onRequestApply,
}: {
  kind: RestrictionKind;
  userId: string;
  active: boolean;
  onRequestApply: () => void;
}) {
  const labels = RESTRICTION_LABELS[kind];

  if (active) {
    return (
      <form action={liftRestriction.bind(null, userId, kind)}>
        <LiftButton label={labels.lift} />
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={onRequestApply}
      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
    >
      {labels.apply}
    </button>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Applying…" : "Confirm"}
    </button>
  );
}

function RestrictionPrompt({
  userId,
  kind,
  username,
  onClose,
}: {
  userId: string;
  kind: RestrictionKind;
  username: string;
  onClose: () => void;
}) {
  const boundAction = applyRestriction.bind(null, userId, kind);
  const [state, formAction] = useActionState<RestrictionActionState, FormData>(boundAction, {});

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />

      <form
        action={formAction}
        className="relative z-10 w-full max-w-xs rounded-xl border border-border bg-surface-raised p-5 shadow-2xl"
      >
        <h3 className="font-display text-sm font-semibold text-foreground">
          {RESTRICTION_LABELS[kind].apply} {username}
        </h3>
        <p className="mt-1 text-xs text-muted">Lifted automatically once the time is up.</p>

        <div className="mt-4 flex gap-2">
          <input
            type="number"
            name="amount"
            min={1}
            max={3650}
            defaultValue={1}
            autoFocus
            className="w-20 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
          <select
            name="unit"
            defaultValue="days"
            className="flex-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="hours">Hours</option>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
          </select>
        </div>

        {state.error && <p className="mt-2 text-xs text-primary-glow">{state.error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <ConfirmButton />
        </div>
      </form>
    </div>
  );
}

export type AuditLogEntry = {
  id: string;
  action: string;
  details: string | null;
  actorUsername: string;
  whenLabel: string;
};

function UserLogsModal({ entries, closeHref }: { entries: AuditLogEntry[]; closeHref: string }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={() => router.push(closeHref)}
        className="absolute inset-0 bg-black/70"
      />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-foreground">Account activity</h3>
          <Link href={closeHref} aria-label="Close" className="text-muted transition hover:text-foreground">
            <X size={20} />
          </Link>
        </div>

        <div className="mt-4 max-h-96 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-muted">No actions recorded yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {entries.map((entry) => (
                <li key={entry.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{entry.action}</p>
                  {entry.details && <p className="text-xs text-muted">{entry.details}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {entry.whenLabel} · by <span className="text-foreground">{entry.actorUsername}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export type NoteEntry = {
  id: string;
  body: string;
  authorUsername: string;
  whenLabel: string;
};

function AddNoteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon mt-2 rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Add note"}
    </button>
  );
}

function AddNoteForm({ userId, noteCount }: { userId: string; noteCount: number }) {
  const boundAction = addNote.bind(null, userId);
  const [state, formAction] = useActionState<NoteActionState, FormData>(boundAction, {});

  return (
    <form action={formAction} className="mt-4 border-t border-border pt-4">
      <textarea
        key={noteCount}
        name="body"
        rows={3}
        maxLength={2000}
        placeholder="Write a note about this account…"
        className="w-full rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      {state.error && <p className="mt-2 text-xs text-primary-glow">{state.error}</p>}
      <AddNoteButton />
    </form>
  );
}

function NotesModal({
  userId,
  entries,
  closeHref,
}: {
  userId: string;
  entries: NoteEntry[];
  closeHref: string;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={() => router.push(closeHref)}
        className="absolute inset-0 bg-black/70"
      />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-foreground">Notes</h3>
          <Link href={closeHref} aria-label="Close" className="text-muted transition hover:text-foreground">
            <X size={20} />
          </Link>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-muted">No notes yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {entries.map((entry) => (
                <li key={entry.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <p className="whitespace-pre-wrap text-sm text-foreground">{entry.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {entry.whenLabel} · by <span className="text-foreground">{entry.authorUsername}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <AddNoteForm userId={userId} noteCount={entries.length} />
      </div>
    </div>
  );
}

export function UserDetailModal({
  user,
  closeHref,
  isSelf,
  logsHref,
  logsCloseHref,
  logs,
  notesHref,
  notesCloseHref,
  notes,
  items,
  grantedItems,
}: {
  user: UserDetail;
  closeHref: string;
  isSelf: boolean;
  logsHref: string;
  logsCloseHref: string;
  logs: AuditLogEntry[] | null;
  notesHref: string;
  notesCloseHref: string;
  notes: NoteEntry[] | null;
  items: ItemOption[];
  grantedItems: GrantedItemEntry[];
}) {
  const router = useRouter();
  const isOwner = user.role === "OWNER";
  const locked = isSelf || isOwner;
  const rank = getRank(user.level);
  const [promptKind, setPromptKind] = useState<RestrictionKind | null>(null);

  const isClean = !user.banned && !user.blocked && !user.marketBlocked && !user.shopBlocked;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (notes !== null) {
        router.push(notesCloseHref);
      } else if (logs !== null) {
        router.push(logsCloseHref);
      } else if (promptKind) {
        setPromptKind(null);
      } else {
        router.push(closeHref);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notes, notesCloseHref, logs, logsCloseHref, promptKind, closeHref, router]);

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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center">
              <Image
                src={rank.image}
                alt={rank.name}
                width={40}
                height={40}
                unoptimized
                className="object-contain"
              />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">{user.username}</h2>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <Link href={closeHref} aria-label="Close" className="text-muted transition hover:text-foreground">
            <X size={20} />
          </Link>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <InfoField label="Full name" value={user.fullName ?? "—"} />
          <InfoField label="Username" value={user.username} />
          <InfoField label="Email address" value={user.email} />
          <InfoField label="Phone number" value={user.phone ?? "—"} />
          <InfoField label="Role" value={user.role} />
          <InfoField label="Sub-roles" value={user.subRoles.length ? user.subRoles.join(", ") : "—"} />
          <InfoField label="Rank" value={`${rank.name} (Level ${user.level})`} />
          <InfoField label="CC Coins" value={`${user.ccCoins} cc`} />
          <InfoField label="Joined" value={user.joinedLabel} />
          <InfoField label="Last login" value={user.lastLoginLabel} />
        </dl>

        <div className="mt-5 flex flex-col gap-1.5">
          {isClean && <Badge tone="success">Active</Badge>}
          {user.banned && (
            <RestrictionStatusRow tone="danger" label="Banned" untilLabel={user.bannedUntilLabel} />
          )}
          {user.blocked && (
            <RestrictionStatusRow tone="warning" label="Blocked" untilLabel={user.blockedUntilLabel} />
          )}
          {user.marketBlocked && (
            <RestrictionStatusRow
              tone="warning"
              label="Market blocked"
              untilLabel={user.marketBlockedUntilLabel}
            />
          )}
          {user.shopBlocked && (
            <RestrictionStatusRow tone="warning" label="Shop blocked" untilLabel={user.shopBlockedUntilLabel} />
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={logsHref}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <History size={14} />
            User logs
          </Link>
          <Link
            href={notesHref}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <StickyNote size={14} />
            Notes
          </Link>
        </div>

        {locked ? (
          <p className="mt-5 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted">
            {isSelf
              ? "You can't moderate or edit your own account."
              : "Owner accounts can't be moderated or edited from here."}
          </p>
        ) : (
          <>
            <div className="mt-4 flex gap-3">
              <RoleSelect userId={user.id} role={user.role} />
              <SubRoleSelect userId={user.id} subRoles={user.subRoles} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <RestrictionButton
                kind="ban"
                userId={user.id}
                active={user.banned}
                onRequestApply={() => setPromptKind("ban")}
              />
              <RestrictionButton
                kind="block"
                userId={user.id}
                active={user.blocked}
                onRequestApply={() => setPromptKind("block")}
              />
              <RestrictionButton
                kind="market"
                userId={user.id}
                active={user.marketBlocked}
                onRequestApply={() => setPromptKind("market")}
              />
              <RestrictionButton
                kind="shop"
                userId={user.id}
                active={user.shopBlocked}
                onRequestApply={() => setPromptKind("shop")}
              />
            </div>
          </>
        )}

        {!locked && <EconomyForm userId={user.id} points={user.points} level={user.level} xp={user.xp} />}

        <GrantedItemsList entries={grantedItems} />
        {!locked && <GrantItemForm userId={user.id} items={items} />}
      </div>

      {promptKind && !locked && (
        <RestrictionPrompt
          userId={user.id}
          kind={promptKind}
          username={user.username}
          onClose={() => setPromptKind(null)}
        />
      )}

      {logs !== null && <UserLogsModal entries={logs} closeHref={logsCloseHref} />}

      {notes !== null && (
        <NotesModal userId={user.id} entries={notes} closeHref={notesCloseHref} />
      )}
    </div>
  );
}
