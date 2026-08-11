"use client";

import { useFormStatus } from "react-dom";
import { Heart } from "lucide-react";
import { toggleLike } from "@/app/(app)/profile/posts-actions";

function LikeSubmitButton({ likeCount, likedByViewer }: { likeCount: number; likedByViewer: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-60 ${
        likedByViewer ? "text-primary" : "text-muted hover:text-primary"
      }`}
    >
      <Heart size={16} fill={likedByViewer ? "currentColor" : "none"} />
      {likeCount}
    </button>
  );
}

export function LikeButton({
  postId,
  username,
  likeCount,
  likedByViewer,
}: {
  postId: string;
  username: string;
  likeCount: number;
  likedByViewer: boolean;
}) {
  return (
    <form action={toggleLike.bind(null, postId, username)}>
      <LikeSubmitButton likeCount={likeCount} likedByViewer={likedByViewer} />
    </form>
  );
}
