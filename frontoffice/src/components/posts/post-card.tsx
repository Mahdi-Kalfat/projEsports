import Image from "next/image";
import Link from "next/link";
import { Trash2, Eye, Repeat2 } from "lucide-react";
import { deletePost } from "@/app/(app)/profile/posts-actions";
import { LikeButton } from "./like-button";
import { RepostButton } from "./repost-button";
import { CommentSection } from "./comment-section";
import { PostViewTracker } from "./post-view-tracker";
import { formatCompactNumber } from "@/lib/format";
import type { PostData, RepostTarget } from "./types";

function formatTimestamp(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function RepostEmbed({ original }: { original: RepostTarget | null }) {
  if (!original) {
    return (
      <p className="mt-3 rounded-xl border border-border/60 bg-surface p-3 text-sm text-muted">
        This post is no longer available.
      </p>
    );
  }

  return (
    <Link
      href={`/profile/${original.author.username}`}
      className="mt-3 block rounded-xl border border-border/60 bg-surface p-3 transition hover:border-primary/40"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
          {original.author.avatarUrl ? (
            <Image src={original.author.avatarUrl} alt="" width={28} height={28} unoptimized className="object-cover" />
          ) : (
            original.author.username.slice(0, 1).toUpperCase()
          )}
        </span>
        <span className="text-sm font-semibold text-foreground">{original.author.username}</span>
        <span className="text-xs text-muted">{formatTimestamp(original.createdAt)}</span>
      </div>

      {original.body && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{original.body}</p>}

      {original.mediaUrl && original.mediaType === "IMAGE" && (
        <div className="relative mt-2 h-56 w-full overflow-hidden rounded-lg border border-border">
          <Image src={original.mediaUrl} alt="" fill unoptimized className="object-cover" />
        </div>
      )}
      {original.mediaUrl && original.mediaType === "VIDEO" && (
        <video src={original.mediaUrl} controls className="mt-2 w-full rounded-lg border border-border" />
      )}
    </Link>
  );
}

export function PostCard({
  post,
  username,
  viewerId,
}: {
  post: PostData;
  username: string;
  viewerId: string;
}) {
  const canDelete = post.author.id === viewerId;
  const isRepost = post.repostOfId !== null;

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <PostViewTracker postId={post.id} />
      <div className="flex items-start gap-3">
        <Link href={`/profile/${post.author.username}`} className="shrink-0">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-sm font-semibold text-primary">
            {post.author.avatarUrl ? (
              <Image src={post.author.avatarUrl} alt="" width={40} height={40} unoptimized className="object-cover" />
            ) : (
              post.author.username.slice(0, 1).toUpperCase()
            )}
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/profile/${post.author.username}`}
              className="text-sm font-semibold text-foreground transition hover:text-primary"
            >
              {post.author.username}
            </Link>
            {canDelete && (
              <form action={deletePost.bind(null, post.id, username)}>
                <button type="submit" aria-label="Delete post" className="text-muted transition hover:text-primary">
                  <Trash2 size={14} />
                </button>
              </form>
            )}
          </div>
          <p className="text-xs text-muted">{formatTimestamp(post.createdAt)}</p>

          {isRepost && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent">
              <Repeat2 size={13} />
              Reposted
            </p>
          )}

          {post.body && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{post.body}</p>}

          {post.mediaUrl && post.mediaType === "IMAGE" && (
            <div className="relative mt-3 h-72 w-full overflow-hidden rounded-xl border border-border">
              <Image src={post.mediaUrl} alt="" fill unoptimized className="object-cover" />
            </div>
          )}
          {post.mediaUrl && post.mediaType === "VIDEO" && (
            <video src={post.mediaUrl} controls className="mt-3 w-full rounded-xl border border-border" />
          )}

          {isRepost && <RepostEmbed original={post.repostOf} />}

          <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
            <LikeButton
              postId={post.id}
              username={username}
              likeCount={post.likeCount}
              likedByViewer={post.likedByViewer}
            />
            <RepostButton
              postId={post.id}
              username={username}
              repostCount={post.repostCount}
              repostedByViewer={post.repostedByViewer}
            />
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted" title={`${post.views} views`}>
              <Eye size={16} />
              {formatCompactNumber(post.views)}
            </span>
          </div>

          <CommentSection
            postId={post.id}
            username={username}
            postAuthorId={post.author.id}
            comments={post.comments}
            viewerId={viewerId}
          />
        </div>
      </div>
    </div>
  );
}
