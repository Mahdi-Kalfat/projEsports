"use client";

import { useFormStatus } from "react-dom";
import { Repeat2 } from "lucide-react";
import { toggleRepost } from "@/app/(app)/profile/posts-actions";

function RepostSubmitButton({ repostCount, repostedByViewer }: { repostCount: number; repostedByViewer: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-60 ${
        repostedByViewer ? "text-accent" : "text-muted hover:text-accent"
      }`}
    >
      <Repeat2 size={16} />
      {repostCount}
    </button>
  );
}

export function RepostButton({
  postId,
  username,
  repostCount,
  repostedByViewer,
}: {
  postId: string;
  username: string;
  repostCount: number;
  repostedByViewer: boolean;
}) {
  return (
    <form action={toggleRepost.bind(null, postId, username)}>
      <RepostSubmitButton repostCount={repostCount} repostedByViewer={repostedByViewer} />
    </form>
  );
}
