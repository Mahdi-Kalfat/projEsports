"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Settings, X } from "lucide-react";
import {
  updateClan,
  transferOwnership,
  disbandClan,
  type ClanActionState,
} from "@/app/(app)/clans/actions";
import { ClanFormFields, type ClanFormDefaults } from "./clan-form-fields";
import type { ClanMemberData } from "./types";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

const initialUpdateState: ClanActionState = {};

function EditClanForm({
  clanId,
  defaults,
  currentLogoUrl,
  currentBannerUrl,
}: {
  clanId: string;
  defaults: ClanFormDefaults;
  currentLogoUrl: string | null;
  currentBannerUrl: string | null;
}) {
  const boundAction = updateClan.bind(null, clanId);
  const [state, formAction] = useActionState(boundAction, initialUpdateState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ClanFormFields defaults={defaults} currentLogoUrl={currentLogoUrl} currentBannerUrl={currentBannerUrl} />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
      {state.success && <p className="text-xs text-success">Saved.</p>}
      <div>
        <SaveButton />
      </div>
    </form>
  );
}

function TransferSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent disabled:opacity-50"
    >
      {pending ? "…" : "Transfer"}
    </button>
  );
}

function DisbandButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Disbanding…" : "Disband clan"}
    </button>
  );
}

function DangerZone({ clanId, otherMembers }: { clanId: string; otherMembers: ClanMemberData[] }) {
  const [confirmingDisband, setConfirmingDisband] = useState(false);

  return (
    <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
        <AlertTriangle size={14} />
        Danger zone
      </div>

      {otherMembers.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted">Transfer ownership to</p>
          <form action={transferOwnership.bind(null, clanId)} className="mt-1.5 flex gap-2">
            <select
              name="newOwnerId"
              required
              className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              {otherMembers.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.username} ({member.role === "ADMIN" ? "Admin" : "Member"})
                </option>
              ))}
            </select>
            <TransferSubmitButton />
          </form>
        </div>
      )}

      <div className="mt-4 border-t border-primary/20 pt-4">
        {confirmingDisband ? (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-xs text-muted">Disband permanently? This can&apos;t be undone.</p>
            <button
              type="button"
              onClick={() => setConfirmingDisband(false)}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <form action={disbandClan.bind(null, clanId)}>
              <DisbandButton />
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDisband(true)}
            className="text-xs font-medium text-primary transition hover:text-primary-glow"
          >
            Disband this clan
          </button>
        )}
      </div>
    </div>
  );
}

export function ClanSettingsButton({
  clanId,
  defaults,
  currentLogoUrl,
  currentBannerUrl,
  otherMembers,
}: {
  clanId: string;
  defaults: ClanFormDefaults;
  currentLogoUrl: string | null;
  currentBannerUrl: string | null;
  otherMembers: ClanMemberData[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
      >
        <Settings size={16} />
        Manage clan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 bg-black/70" />

          <div className="relative z-10 mx-auto my-8 w-full max-w-lg rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Manage clan</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted transition hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4">
              <EditClanForm
                clanId={clanId}
                defaults={defaults}
                currentLogoUrl={currentLogoUrl}
                currentBannerUrl={currentBannerUrl}
              />
            </div>

            <DangerZone clanId={clanId} otherMembers={otherMembers} />
          </div>
        </div>
      )}
    </>
  );
}
