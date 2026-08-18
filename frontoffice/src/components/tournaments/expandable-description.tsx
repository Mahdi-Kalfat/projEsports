"use client";

import { useEffect, useRef, useState } from "react";

// Collapses to 4 lines with a "View more"/"View less" toggle — whitespace-pre-wrap
// so line breaks the admin typed in the textarea actually render as line breaks
// instead of collapsing into one run-on paragraph. The toggle only shows up
// when the text actually overflows 4 lines, measured once against the
// collapsed (clamped) layout — a short description just renders plainly.
export function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div className="mt-5">
      <p ref={ref} className={`whitespace-pre-wrap text-sm text-muted ${expanded ? "" : "line-clamp-4"}`}>
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-medium text-primary transition hover:text-primary-glow"
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
}
