"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Trash2 } from "lucide-react";
import { addComment, deleteComment, type PostActionState } from "@/app/(app)/profile/posts-actions";
import type { PostCommentData } from "./types";

function CommentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "…" : "Post"}
    </button>
  );
}

const initialState: PostActionState = {};

function AddCommentForm({ postId, username }: { postId: string; username: string }) {
  const boundAction = addComment.bind(null, postId, username);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="mt-2 flex items-center gap-2">
      <input
        type="text"
        name="body"
        maxLength={300}
        placeholder="Write a comment…"
        className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
      />
      <CommentSubmitButton />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}

export function CommentSection({
  postId,
  username,
  postAuthorId,
  comments,
  viewerId,
}: {
  postId: string;
  username: string;
  postAuthorId: string;
  comments: PostCommentData[];
  viewerId: string;
}) {
  // Starts expanded whenever there's anything to show. A plain useState(comments.length > 0)
  // would go stale after the first mount — its initializer only runs once, so a comment
  // added later via the live form wouldn't flip an already-mounted "collapsed" state.
  // Always-expanded avoids that trap; the toggle below is just a manual convenience for
  // hiding a long thread, not what decides visibility after new comments arrive.
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mt-3 border-t border-border pt-3">
      {comments.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground"
        >
          <MessageCircle size={14} />
          {comments.length} comment{comments.length === 1 ? "" : "s"}
        </button>
      )}

      {expanded && (
        <ul className="mt-2 flex flex-col gap-2">
          {comments.map((comment) => {
            const canDelete = comment.author.id === viewerId || postAuthorId === viewerId;
            return (
              <li key={comment.id} className="flex items-start gap-2">
                <Link href={`/profile/${comment.author.username}`} className="shrink-0">
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {comment.author.avatarUrl ? (
                      <Image
                        src={comment.author.avatarUrl}
                        alt=""
                        width={24}
                        height={24}
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      comment.author.username.slice(0, 1).toUpperCase()
                    )}
                  </span>
                </Link>
                <div className="flex-1 rounded-md bg-surface px-3 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/profile/${comment.author.username}`}
                      className="text-xs font-semibold text-foreground hover:text-primary"
                    >
                      {comment.author.username}
                    </Link>
                    {canDelete && (
                      <form action={deleteComment.bind(null, comment.id, username)}>
                        <button
                          type="submit"
                          aria-label="Delete comment"
                          className="text-muted transition hover:text-primary"
                        >
                          <Trash2 size={12} />
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="text-xs text-foreground">{comment.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AddCommentForm postId={postId} username={username} />
    </div>
  );
}
