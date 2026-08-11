import Link from "next/link";
import { NAV_ITEMS, USER_MENU_ITEMS } from "@/lib/nav-items";

// Footer mirrors the full site map, including the personal/account items
// (Inventory, Friends, Messages) that live under the navbar's username
// dropdown rather than as flat top-level links there — the footer isn't
// hover-driven, so it just lists everything.
const FOOTER_ITEMS = [...NAV_ITEMS, ...USER_MENU_ITEMS];

export function Footer() {
  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between lg:px-6">
        <div className="text-center sm:text-left">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            Esport<span className="neon-text">Web</span>
          </p>
          <p className="mt-1 text-xs text-muted">Compete, connect, and climb the ranks.</p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {FOOTER_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium uppercase tracking-wide text-muted transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
