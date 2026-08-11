"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { UserPlus, UserCheck, Check, X, Clock, MessageCircle } from "lucide-react";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequestToUser,
  type FriendActionState,
} from "@/app/(app)/friends/actions";
import type { FriendshipStatus } from "@/lib/friends";

function AddFriendSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <UserPlus size={16} />
      {pending ? "Sending…" : "Add Friend"}
    </button>
  );
}

function AddFriendButton({ targetUserId }: { targetUserId: string }) {
  const boundAction = sendFriendRequestToUser.bind(null, targetUserId);
  const initialState: FriendActionState = {};
  const [state, formAction] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-4 py-2 text-sm font-semibold text-warning">
        <Clock size={16} />
        Request sent
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <AddFriendSubmitButton />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}

export function FriendAction({
  status,
  targetUserId,
  targetUsername,
}: {
  status: FriendshipStatus;
  targetUserId: string;
  targetUsername: string;
}) {
  if (status.kind === "SELF") return null;

  if (status.kind === "NONE") {
    return <AddFriendButton targetUserId={targetUserId} />;
  }

  if (status.kind === "PENDING_SENT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-4 py-2 text-sm font-semibold text-warning">
        <Clock size={16} />
        Request sent
      </span>
    );
  }

  if (status.kind === "PENDING_RECEIVED") {
    return (
      <div className="flex gap-2">
        <form action={acceptFriendRequest.bind(null, status.requestId)}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-success px-4 py-2 text-sm font-semibold text-canvas transition hover:brightness-110"
          >
            <Check size={16} />
            Accept
          </button>
        </form>
        <form action={declineFriendRequest.bind(null, status.requestId)}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <X size={16} />
            Decline
          </button>
        </form>
      </div>
    );
  }

  // FRIENDS
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-4 py-2 text-sm font-semibold text-success">
        <UserCheck size={16} />
        Friends
      </span>
      <Link
        href={`/messages/${targetUsername}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
      >
        <MessageCircle size={16} />
        Message
      </Link>
      <form action={removeFriend.bind(null, targetUserId)}>
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
        >
          Remove
        </button>
      </form>
    </div>
  );
}
