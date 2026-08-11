"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-items";
import { logout } from "@/app/(app)/actions";

export function Header({
  onMenuClick,
  username,
  role,
}: {
  onMenuClick: () => void;
  username: string;
  role: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const title =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ?? "Back Office";

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface px-4 lg:px-6">
      <button
        aria-label="Open navigation"
        onClick={onMenuClick}
        className="text-muted hover:text-foreground lg:hidden"
      >
        <Menu size={22} />
      </button>

      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h2>

      <div className="ml-auto">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
            className="flex items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-2 text-left transition hover:bg-surface-raised"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-display text-sm font-semibold text-primary">
              {username.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden flex-col sm:flex">
              <span className="text-sm font-medium leading-tight text-foreground">
                {username}
              </span>
              <span className="text-xs leading-tight text-muted">{role}</span>
            </span>
            <ChevronDown size={16} className="text-muted" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-md border border-border bg-surface-raised shadow-2xl">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
