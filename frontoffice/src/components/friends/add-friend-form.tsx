"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { sendFriendRequestByCode, type FriendActionState } from "@/app/(app)/friends/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <UserPlus size={16} />
      {pending ? "Sending…" : "Send request"}
    </button>
  );
}

const initialState: FriendActionState = {};

export function AddFriendForm({ ownCode }: { ownCode: string | null }) {
  const [state, formAction] = useActionState(sendFriendRequestByCode, initialState);

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Add a friend</p>
      <p className="mt-1 text-sm text-muted">Enter another player&apos;s friend code to send them a request.</p>

      <form action={formAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          name="code"
          placeholder="AB3X-9KPQ"
          maxLength={9}
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm uppercase tracking-wider text-foreground outline-none focus:border-primary"
        />
        <SubmitButton />
      </form>
      {state.error && <p className="mt-2 text-xs text-primary-glow">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-success">Request sent!</p>}

      {ownCode && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
          Your code: <span className="font-display font-semibold tracking-wider text-accent">{ownCode}</span>
        </p>
      )}
    </div>
  );
}
