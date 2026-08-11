"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import {
  updateBattlePass,
  deleteBattlePass,
  setBattlePassStatus,
  type BattlePassFormState,
} from "@/app/(app)/battle-pass/actions";
import { BattlePassFormFields, type BattlePassFormDefaults } from "./battle-pass-form-fields";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

const SELECT_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary";

function StatusSelect({ battlePassId, status }: { battlePassId: string; status: string }) {
  return (
    <form action={setBattlePassStatus.bind(null, battlePassId)}>
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
  battlePassId,
  title,
  onClose,
}: {
  battlePassId: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />

      <form
        action={deleteBattlePass.bind(null, battlePassId)}
        className="relative z-10 w-full max-w-xs rounded-xl border border-border bg-surface-raised p-5 shadow-2xl"
      >
        <h3 className="font-display text-sm font-semibold text-foreground">Delete &ldquo;{title}&rdquo;?</h3>
        <p className="mt-1 text-xs text-muted">This deletes all of its tiers too. This can&apos;t be undone.</p>

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

const initialState: BattlePassFormState = {};

export function BattlePassEditForm({
  battlePassId,
  status,
  defaults,
}: {
  battlePassId: string;
  status: string;
  defaults: BattlePassFormDefaults;
}) {
  const boundAction = updateBattlePass.bind(null, battlePassId);
  const [state, formAction] = useActionState(boundAction, initialState);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <form action={formAction} className="flex flex-col gap-3">
        <BattlePassFormFields defaults={defaults} />

        {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
        {state.success && <p className="text-xs text-success">Saved.</p>}

        <div className="flex justify-end border-t border-border pt-3">
          <SaveButton />
        </div>
      </form>

      {/* StatusSelect renders its own <form> — kept OUTSIDE the season edit
          form above, since nested <form> elements are invalid HTML and
          silently break requestSubmit() on the inner one. */}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
        <div className="max-w-[10rem]">
          <StatusSelect battlePassId={battlePassId} status={status} />
        </div>

        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      {confirmingDelete && (
        <DeleteConfirmPrompt
          battlePassId={battlePassId}
          title={defaults.title}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
