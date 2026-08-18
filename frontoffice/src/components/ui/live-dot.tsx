// Design plan §16: nothing in the app moved to signal "happening right now."
// A small pulsing dot inside LIVE status badges — reuses Tailwind's built-in
// animate-ping rather than a bespoke keyframe.
export function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
    </span>
  );
}
