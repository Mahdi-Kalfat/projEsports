"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, X } from "lucide-react";
import { createPost, type PostActionState } from "@/app/(app)/profile/posts-actions";

function SubmitButton() {
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

function ComposerFields({
  formAction,
  error,
}: {
  formAction: (formData: FormData) => void;
  error?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-surface-raised p-5">
      <textarea
        name="body"
        rows={3}
        maxLength={1000}
        placeholder="Share something with your profile visitors…"
        className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />

      {fileName && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="truncate">{fileName}</span>
          <button
            type="button"
            onClick={() => {
              setFileName(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="ml-auto text-muted transition hover:text-primary"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted transition hover:text-accent">
          <ImagePlus size={16} />
          Photo / video
          <input
            ref={fileInputRef}
            type="file"
            name="media"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/ogg"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <SubmitButton />
      </div>
      {error && <p className="mt-2 text-xs text-primary-glow">{error}</p>}
    </form>
  );
}

const initialState: PostActionState = {};

export function CreatePostForm({ username }: { username: string }) {
  const boundAction = createPost.bind(null, username);
  const [state, formAction] = useActionState(boundAction, initialState);

  // Remounting ComposerFields on success resets its textarea/file input/fileName
  // state for free (a fresh instance mounts empty) — no imperative form.reset()
  // or effect-based setState needed. See "Resetting state with a key" in the
  // React docs for this pattern.
  const [postCount, setPostCount] = useState(0);
  const [handledSuccess, setHandledSuccess] = useState(false);
  if (state.success && !handledSuccess) {
    setHandledSuccess(true);
    setPostCount((count) => count + 1);
  } else if (!state.success && handledSuccess) {
    setHandledSuccess(false);
  }

  return <ComposerFields key={postCount} formAction={formAction} error={state.error} />;
}
