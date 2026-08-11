"use client";

import { useEffect, useRef } from "react";

// Fires once per mount (a page load/navigation, not every re-render) — records
// an impression, including the author's own views. Renders nothing.
export function PostViewTracker({ postId }: { postId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {});
  }, [postId]);

  return null;
}
