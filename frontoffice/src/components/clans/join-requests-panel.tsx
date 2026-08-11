import Image from "next/image";
import { Check, X } from "lucide-react";
import { approveJoinRequest, declineJoinRequest } from "@/app/(app)/clans/actions";
import type { ClanJoinRequestData } from "./types";

export function JoinRequestsPanel({ requests }: { requests: ClanJoinRequestData[] }) {
  if (requests.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Pending join requests ({requests.length})
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {requests.map((request) => (
          <li key={request.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
              {request.user.avatarUrl ? (
                <Image src={request.user.avatarUrl} alt="" width={36} height={36} unoptimized className="object-cover" />
              ) : (
                request.user.username.slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{request.user.username}</p>
              <p className="text-xs text-muted">Level {request.user.level}</p>
            </div>
            <form action={approveJoinRequest.bind(null, request.id)}>
              <button
                type="submit"
                aria-label={`Approve ${request.user.username}`}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-success/15 text-success transition hover:bg-success/25"
              >
                <Check size={16} />
              </button>
            </form>
            <form action={declineJoinRequest.bind(null, request.id)}>
              <button
                type="submit"
                aria-label={`Decline ${request.user.username}`}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition hover:border-primary hover:text-primary"
              >
                <X size={16} />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
