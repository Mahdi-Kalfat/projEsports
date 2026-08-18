"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { createPortal } from "react-dom";

// Black, half-transparent scrim below the navbar, portaled to document.body
// (same technique as components/ui/confetti.tsx) rather than `absolute
// inset-0` against the page's own content div — an in-page absolute overlay
// is only as tall as that div (header + a bit of content), so it has a
// visible bottom edge where the tint stops short of the footer. `top-16`
// matches the navbar's fixed height (see components/nav/navbar.tsx's h-16)
// so the nav itself stays clear and usable while a page is locked.
//
// Rendering only starts after mount (not gated on `typeof document`
// directly): server and the client's first hydration pass both render
// nothing, and the portal appears a tick later via this effect — doing the
// document check inline instead made the client's first render differ from
// the server's, which is exactly what triggers a hydration mismatch.
export function LockedFeature({ title, message }: { title: string; message: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/45 p-4 text-center backdrop-blur-sm">
      <Lock size={28} className="text-white/80" />
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="max-w-xs text-sm text-white/80">{message}</p>
    </div>,
    document.body,
  );
}
