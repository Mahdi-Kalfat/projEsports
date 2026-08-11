"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [trackedDefault, setTrackedDefault] = useState(defaultValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Resync when the URL's q changes from outside this input (e.g. the "Clear
  // filters" link, browser back/forward) — adjusted during render, React's
  // sanctioned pattern for this, rather than in an effect: it reacts to the
  // prop change in the same pass instead of triggering an extra render, and
  // (since it's a no-op once value already matches) never interrupts typing.
  if (defaultValue !== trackedDefault) {
    setTrackedDefault(defaultValue);
    setValue(defaultValue);
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function handleChange(next: string) {
    setValue(next);
    clearTimeout(timeoutRef.current);
    // Debounced rather than firing a navigation per keystroke — one query per
    // pause in typing, not one per character.
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set("q", next);
      } else {
        params.delete("q");
      }
      params.delete("page");
      const qs = params.toString();
      // replace, not push — every keystroke shouldn't add a back-button stop.
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, DEBOUNCE_MS);
  }

  return (
    <input
      type="search"
      name="q"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      placeholder="Search by username or email…"
      className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
    />
  );
}
