import Link from "next/link";
import Image from "next/image";
import { NAV_ITEMS, USER_MENU_ITEMS, getNavItemConfigs, resolveEnabledNav } from "@/lib/nav-items";

// Footer mirrors the full site map, including the personal/account items
// (Inventory, Friends, Messages) that live under the navbar's username
// dropdown rather than as flat top-level links there — the footer isn't
// hover-driven, so it just lists everything. Respects the same admin
// enabled/order overrides as the navbar (a hidden item shouldn't still be
// linkable from here) — server component, so it fetches its own config
// rather than needing it threaded down as a prop like Navbar does.
export async function Footer() {
  const configs = await getNavItemConfigs();
  const footerItems = [...resolveEnabledNav(NAV_ITEMS, configs), ...resolveEnabledNav(USER_MENU_ITEMS, configs)];

  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between lg:px-6">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Image src="/logo-clutcher-mark.png" alt="Clutcher" width={400} height={267} unoptimized className="h-10 w-auto" />
          <p className="text-xs text-muted">Compete, connect, and climb the ranks.</p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {footerItems.map((item) => (
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
