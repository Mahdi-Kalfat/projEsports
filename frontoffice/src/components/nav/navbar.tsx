"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { NAV_ITEMS, USER_MENU_ITEMS, type NavItem } from "@/lib/nav-items";
import { LevelBadge } from "./level-badge";
import { logout } from "@/app/(app)/actions";

// Hover-triggered dropdown grouping the personal/account nav destinations
// (Inventory, Friends, Messages) under the username, inserted after
// Marketplace in the main nav. Uses onMouseEnter/onMouseLeave (not CSS
// group-hover) with a short close delay so moving the cursor from the
// trigger down into the panel doesn't flicker closed in the gap between
// them — mouseleave on the wrapping div only fires once the pointer leaves
// the whole subtree, not when crossing between the button and the panel.
function UserNavMenu({
  username,
  items,
  badgeCounts,
  isActive,
}: {
  username: string;
  items: NavItem[];
  badgeCounts: Record<string, number>;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpen(true);
  }
  function handleLeave() {
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  }

  const activeInMenu = items.some((item) => isActive(item.href));
  const totalBadge = items.reduce((sum, item) => sum + (badgeCounts[item.href] ?? 0), 0);

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        className={`relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition ${
          activeInMenu ? "text-primary" : "text-muted hover:text-foreground"
        }`}
      >
        {username}
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
        {totalBadge > 0 && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-[0_0_6px_rgba(255,30,60,0.8)]">
            {totalBadge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="glass-panel absolute left-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-md border border-border shadow-2xl"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <item.icon size={16} />
                  {item.label}
                </span>
                {(badgeCounts[item.href] ?? 0) > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {badgeCounts[item.href]}
                  </span>
                )}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar({
  username,
  level,
  avatarUrl,
  pendingFriendRequests = 0,
  initialUnreadMessages = 0,
}: {
  username: string;
  level: number;
  avatarUrl: string | null;
  pendingFriendRequests?: number;
  initialUnreadMessages?: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/messages/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const data: { count: number } = await res.json();
        setUnreadMessages(data.count);
      } catch {
        // Background poll — ignore transient failures, next tick retries.
      }
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const badgeCounts: Record<string, number> = { "/friends": pendingFriendRequests, "/messages": unreadMessages };

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  // UserNavMenu (Inventory/Clans/Friends/Messages, labeled with the
  // username) is inserted right after the LAST flat NAV_ITEMS entry — split
  // the list at its end rather than hardcoding which href that is, so
  // adding/reordering NAV_ITEMS (e.g. Battle Pass after Marketplace)
  // doesn't silently break the split.
  const lastFlatNavIndex = NAV_ITEMS.length - 1;
  const navItemsBeforeUserMenu = NAV_ITEMS.slice(0, lastFlatNavIndex + 1);
  const navItemsAfterUserMenu = NAV_ITEMS.slice(lastFlatNavIndex + 1);

  function renderDesktopLink(item: NavItem) {
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative rounded-md px-3 py-2 text-sm font-medium transition ${
          isActive(item.href) ? "text-primary" : "text-muted hover:text-foreground"
        }`}
      >
        {item.label}
        {(badgeCounts[item.href] ?? 0) > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-[0_0_6px_rgba(255,30,60,0.8)]">
            {badgeCounts[item.href]}
          </span>
        )}
        {isActive(item.href) && (
          <motion.span
            layoutId="nav-underline"
            className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
            style={{ boxShadow: "0 0 8px 1px rgba(255,30,60,0.8)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </Link>
    );
  }

  function renderMobileLink(item: NavItem) {
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition ${
          isActive(item.href) ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface-raised hover:text-foreground"
        }`}
      >
        {item.label}
        {(badgeCounts[item.href] ?? 0) > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
            {badgeCounts[item.href]}
          </span>
        )}
      </Link>
    );
  }

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 lg:px-6">
        <Link href="/" className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Esport<span className="neon-text">Web</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {navItemsBeforeUserMenu.map(renderDesktopLink)}
          <UserNavMenu username={username} items={USER_MENU_ITEMS} badgeCounts={badgeCounts} isActive={isActive} />
          {navItemsAfterUserMenu.map(renderDesktopLink)}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block">
            <LevelBadge level={level} />
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
              className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 transition hover:bg-surface-raised"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-sm font-semibold text-primary ring-2 ring-primary/20">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" width={32} height={32} unoptimized className="object-cover" />
                ) : (
                  username.slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="hidden text-sm font-medium text-foreground sm:inline">{username}</span>
              <ChevronDown size={16} className="text-muted" />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="glass-panel absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-md border border-border shadow-2xl"
                >
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3.5 py-2.5 text-left text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="text-muted hover:text-foreground lg:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {navItemsBeforeUserMenu.map(renderMobileLink)}

              <p className="mt-2 border-t border-border px-3 pt-3 text-xs font-medium uppercase tracking-wide text-muted">
                {username}
              </p>
              {USER_MENU_ITEMS.map(renderMobileLink)}

              {navItemsAfterUserMenu.map(renderMobileLink)}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
