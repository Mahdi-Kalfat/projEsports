import type { ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

// Splits message text on bare URLs and renders each as a clickable link —
// payment method "details" (e.g. a link-based method like ba9chich) show up
// verbatim inside the auto-generated purchase message, so without this
// they'd just be inert text.
export function linkifyText(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, i) =>
    part.startsWith("http://") || part.startsWith("https://") ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
