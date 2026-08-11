// Persistent atmosphere behind every (app) page — fixed so it never scrolls away,
// -z-10 so it always sits behind real content. Static/server-renderable: no motion
// needed, the glow-pulse/float keyframes in globals.css already animate it.
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-canvas">
      <div
        className="bg-grid absolute inset-0 opacity-60"
        style={{
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
        }}
      />
      <span className="animate-glow-pulse absolute -left-40 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <span className="animate-glow-pulse absolute -right-40 top-64 h-96 w-96 rounded-full bg-accent/10 blur-3xl [animation-delay:2s]" />
      <span className="animate-glow-pulse absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/5 blur-3xl [animation-delay:1s]" />
    </div>
  );
}
