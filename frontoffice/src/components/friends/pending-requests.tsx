import Image from "next/image";
import { Check, Clock, X } from "lucide-react";
import { acceptFriendRequest, declineFriendRequest } from "@/app/(app)/friends/actions";

export type PendingRow = {
  requestId: string;
  username: string;
  avatarUrl: string | null;
};

export function IncomingRequests({ requests }: { requests: PendingRow[] }) {
  if (requests.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Pending invites ({requests.length})
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {requests.map((request) => (
          <li
            key={request.requestId}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-sm font-semibold text-primary">
              {request.avatarUrl ? (
                <Image src={request.avatarUrl} alt="" width={40} height={40} unoptimized className="object-cover" />
              ) : (
                request.username.slice(0, 1).toUpperCase()
              )}
            </span>
            <p className="flex-1 truncate text-sm font-medium text-foreground">{request.username}</p>
            <form action={acceptFriendRequest.bind(null, request.requestId)}>
              <button
                type="submit"
                aria-label={`Accept ${request.username}`}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-success/15 text-success transition hover:bg-success/25"
              >
                <Check size={16} />
              </button>
            </form>
            <form action={declineFriendRequest.bind(null, request.requestId)}>
              <button
                type="submit"
                aria-label={`Decline ${request.username}`}
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

export function OutgoingRequests({ requests }: { requests: PendingRow[] }) {
  if (requests.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Sent invites ({requests.length})</p>
      <ul className="mt-3 flex flex-col gap-2">
        {requests.map((request) => (
          <li
            key={request.requestId}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-sm font-semibold text-primary">
              {request.avatarUrl ? (
                <Image src={request.avatarUrl} alt="" width={40} height={40} unoptimized className="object-cover" />
              ) : (
                request.username.slice(0, 1).toUpperCase()
              )}
            </span>
            <p className="flex-1 truncate text-sm font-medium text-foreground">{request.username}</p>
            <span className="inline-flex items-center gap-1 text-xs text-warning">
              <Clock size={12} />
              Pending
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
