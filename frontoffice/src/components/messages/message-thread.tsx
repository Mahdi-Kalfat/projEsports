"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { sendMessage, deleteMessage, type MessageActionState } from "@/app/(app)/messages/actions";
import { formatLastSeen } from "@/lib/format";

const POLL_INTERVAL_MS = 4000;

type MessageData = { id: string; body: string; senderId: string; createdAt: Date };
type FriendData = { id: string; username: string; avatarUrl: string | null; lastLoginAt: Date | null };

function SendSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "…" : "Send"}
    </button>
  );
}

const initialState: MessageActionState = {};

function SendMessageForm({
  receiverId,
  friendUsername,
  onSent,
}: {
  receiverId: string;
  friendUsername: string;
  onSent: () => void;
}) {
  const boundAction = sendMessage.bind(null, receiverId, friendUsername);
  const [state, formAction] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onSent();
    }
  }, [state, onSent]);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2 border-t border-border pt-3">
      <input
        type="text"
        name="body"
        maxLength={1000}
        placeholder="Message…"
        autoComplete="off"
        className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      <SendSubmitButton />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}

export function MessageThread({
  conversationId,
  friend,
  viewerId,
  initialMessages,
  canSend,
}: {
  conversationId: string | null;
  friend: FriendData;
  viewerId: string;
  initialMessages: MessageData[];
  canSend: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const pollNowRef = useRef<() => void>(() => {});
  // Tombstones for locally-deleted ids: a poll request in flight when a
  // delete happens can still resolve with the now-deleted message (it was
  // fetched before the delete committed server-side), which would otherwise
  // silently resurrect it in the merge below. Deletes are rare enough that
  // this ref just grows for the component's lifetime rather than pruning.
  const deletedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;
    let sinceIso = messages.at(-1)?.createdAt.toISOString() ?? new Date(0).toISOString();

    async function poll() {
      try {
        const res = await fetch(`/api/messages/${conversationId}?since=${encodeURIComponent(sinceIso)}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data: { messages: Array<Omit<MessageData, "createdAt"> & { createdAt: string }>; serverTime: string } =
          await res.json();

        if (data.messages.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = data.messages
              .filter((m) => !seen.has(m.id) && !deletedIdsRef.current.has(m.id))
              .map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
          });
        }
        sinceIso = data.serverTime;
      } catch {
        // Background poll — a network hiccup just waits for the next tick.
      }
    }

    pollNowRef.current = poll;
    poll(); // immediate fetch on mount (also marks-as-read right away), not just after the first interval
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // sinceIso intentionally isn't a reactive dependency — it's advanced via
    // data.serverTime inside the closure, not re-derived from `messages`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function handleDelete(messageId: string) {
    deletedIdsRef.current.add(messageId);
    await deleteMessage(messageId, friend.username);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {friend.avatarUrl ? (
            <Image src={friend.avatarUrl} alt="" width={36} height={36} unoptimized className="object-cover" />
          ) : (
            friend.username.slice(0, 1).toUpperCase()
          )}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{friend.username}</p>
          <p className="text-xs text-muted">{formatLastSeen(friend.lastLoginAt)}</p>
        </div>
      </div>

      <ul className="flex min-h-[30vh] flex-col gap-2">
        {messages.length === 0 && <p className="text-sm text-muted">Say hi to start the conversation.</p>}
        {messages.map((m) => {
          const own = m.senderId === viewerId;
          return (
            <li key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`group flex max-w-[75%] items-center gap-1.5 ${own ? "flex-row-reverse" : ""}`}>
                <div className={`rounded-md px-3 py-1.5 text-sm ${own ? "bg-primary text-white" : "bg-surface text-foreground"}`}>
                  {m.body}
                </div>
                {own && (
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    aria-label="Delete message"
                    className="text-muted opacity-0 transition group-hover:opacity-100 hover:text-primary"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {canSend ? (
        <SendMessageForm receiverId={friend.id} friendUsername={friend.username} onSent={() => pollNowRef.current()} />
      ) : (
        <p className="border-t border-border pt-3 text-center text-xs text-muted">
          You&apos;re no longer friends with {friend.username} — you can&apos;t send new messages, but your history is kept.
        </p>
      )}
    </div>
  );
}
