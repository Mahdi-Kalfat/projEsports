"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { MessageSquareText, Trash2 } from "lucide-react";
import {
  addProfileComment,
  deleteProfileComment,
  type ProfileCommentActionState,
} from "@/app/(app)/profile/profile-comments-actions";
import { Reveal } from "@/components/ui/reveal";
import type { PostAuthor } from "@/components/posts/types";

export type ProfileWallCommentData = {
  id: string;
  body: string;
  createdAt: Date;
  author: PostAuthor;
};

function formatTimestamp(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function CommentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Posting…" : "Post"}
    </button>
  );
}

const initialState: ProfileCommentActionState = {};

function AddWallCommentForm({ profileId, username }: { profileId: string; username: string }) {
  const boundAction = addProfileComment.bind(null, profileId, username);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <input
        type="text"
        name="body"
        maxLength={300}
        placeholder={`Write something on ${username}'s wall…`}
        className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      <CommentSubmitButton />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}

export function ProfileWall({
  profileId,
  username,
  comments,
  viewerId,
}: {
  profileId: string;
  username: string;
  comments: ProfileWallCommentData[];
  viewerId: string;
}) {
  return (
    <Reveal delay={0.15}>
      <div className="rounded-2xl border border-border bg-surface-raised p-5">
        <div className="flex items-center gap-2">
          <MessageSquareText size={18} className="text-primary" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            Wall
          </h3>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
            {comments.length}
          </span>
        </div>

        <div className="mt-4">
          <AddWallCommentForm profileId={profileId} username={username} />
        </div>

        {comments.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No comments yet — be the first to say something.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {comments.map((comment) => {
              const canDelete = comment.author.id === viewerId || profileId === viewerId;
              return (
                <li key={comment.id} className="flex items-start gap-3">
                  <Link href={`/profile/${comment.author.username}`} className="shrink-0">
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {comment.author.avatarUrl ? (
                        <Image
                          src={comment.author.avatarUrl}
                          alt=""
                          width={32}
                          height={32}
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        comment.author.username.slice(0, 1).toUpperCase()
                      )}
                    </span>
                  </Link>
                  <div className="min-w-0 flex-1 rounded-md bg-surface px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${comment.author.username}`}
                          className="text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {comment.author.username}
                        </Link>
                        <span className="text-xs text-muted">{formatTimestamp(comment.createdAt)}</span>
                      </div>
                      {canDelete && (
                        <form action={deleteProfileComment.bind(null, comment.id, username)}>
                          <button
                            type="submit"
                            aria-label="Delete comment"
                            className="text-muted transition hover:text-primary"
                          >
                            <Trash2 size={13} />
                          </button>
                        </form>
                      )}
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Reveal>
  );
}
