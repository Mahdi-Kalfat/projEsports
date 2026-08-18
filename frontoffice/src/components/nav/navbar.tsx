"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Coins, LogOut, Menu, User, X } from "lucide-react";
import {
  NAV_ITEMS,
  USER_MENU_ITEMS,
  resolveEnabledNav,
  type NavItem,
  type NavConfigEntry,
} from "@/lib/nav-items";
import type { RankOverride } from "@/lib/rank";
import { LevelBadge } from "./level-badge";
import { logout } from "@/app/(app)/actions";

// Small red "HOT"/"NEW" sticker, admin-set per item from the back office's
// /navigation page — pinned to the top-right corner via absolute
// positioning (parent must be `relative`) so it sits on top of the item
// instead of widening it. pointer-events-none keeps it from stealing the
// link's click/hover target. A slight tilt + the site's existing
// glow-pulse animation (see globals.css, also used by the landing hero)
// makes it read as an attention-grabbing tag rather than a flat pill.
function NavLabelBadge({ badge }: { badge?: NavItem["badge"] }) {
  if (!badge) return null;
  return (
    <span
      className="animate-glow-pulse pointer-events-none absolute -right-2.5 -top-2.5 -rotate-6 rounded-[3px] bg-gradient-to-br from-primary-glow to-crimson px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-white shadow-[0_1px_4px_rgba(0,0,0,0.5),0_0_10px_rgba(255,30,60,0.8)] ring-1 ring-white/25"
    >
      {badge}
    </span>
  );
}

// Hover-triggered dropdown grouping the personal/account nav destinations
// (Inventory, Friends, Messages) under the username, inserted after
// Marketplace in the main nav. Uses onMouseEnter/onMouseLeave (not CSS
// group-hover) with a short close delay so moving the cursor from the
// trigger down into the panel doesn't flicker closed in the gap between
// them — mouseleave on the wrapping div only fires once the pointer leaves
// the whole subtree, not when crossing between the button and the panel.
// Account-only, so it's never rendered for a guest (see Navbar below).
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
                  <span className="relative inline-block">
                    {item.label}
                    <NavLabelBadge badge={item.badge} />
                  </span>
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

export type NavbarUser = {
  username: string;
  level: number;
  avatarUrl: string | null;
  ccCoins: number;
  pendingFriendRequests?: number;
  initialUnreadMessages?: number;
};

export function Navbar({
  user,
  rankOverrides = [],
  navConfigs = [],
}: {
  // null = guest/visitor — no account-scoped UI (cc balance, level badge,
  // username dropdown, Inventory/Clans/Friends/Messages menu) renders at
  // all; the top-level nav links (Home/Tournaments/Shop/etc, still resolved
  // from navConfigs the same way) stay visible so guests can browse.
  user: NavbarUser | null;
  rankOverrides?: RankOverride[];
  navConfigs?: NavConfigEntry[];
}) {
  const pathname = usePathname();
  // Icons live in NAV_ITEMS/USER_MENU_ITEMS (this module, client-side only —
  // a LucideIcon component reference can't cross the Server->Client prop
  // boundary), resolved here against the plain enabled/order data the server
  // actually fetched from NavItemConfig.
  const navItems = resolveEnabledNav(NAV_ITEMS, navConfigs);
  const userMenuItems = resolveEnabledNav(USER_MENU_ITEMS, navConfigs);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(user?.initialUnreadMessages ?? 0);

  useEffect(() => {
    if (!user) return; // guests have no messages to poll for
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
  }, [user]);

  const badgeCounts: Record<string, number> = user
    ? { "/friends": user.pendingFriendRequests ?? 0, "/messages": unreadMessages }
    : {};

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  // UserNavMenu (Inventory/Clans/Friends/Messages, labeled with the
  // username) is inserted right after the LAST flat navItems entry — split
  // the list at its end rather than hardcoding which href that is, so
  // admin-reordered navItems (see /navigation in the back office) don't
  // silently break the split. Guests have no menu to insert, so the split
  // is moot for them — navItems just renders as one flat list.
  const lastFlatNavIndex = navItems.length - 1;
  const navItemsBeforeUserMenu = navItems.slice(0, lastFlatNavIndex + 1);
  const navItemsAfterUserMenu = navItems.slice(lastFlatNavIndex + 1);

  function renderDesktopLink(item: NavItem) {
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative rounded-md px-3 py-2 text-sm font-medium transition ${
          isActive(item.href) ? "text-primary" : "text-muted hover:text-foreground"
        }`}
      >
        <span className="relative inline-block">
          {item.label}
          <NavLabelBadge badge={item.badge} />
        </span>
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
        <span className="relative inline-block">
          {item.label}
          <NavLabelBadge badge={item.badge} />
        </span>
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
        <Link href="/" className="flex shrink-0 items-center">
          <Image src="/logo-clutcher.png" alt="Clutcher" width={600} height={444} unoptimized priority className="h-11 w-auto" />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {navItemsBeforeUserMenu.map(renderDesktopLink)}
          {user && (
            <UserNavMenu username={user.username} items={userMenuItems} badgeCounts={badgeCounts} isActive={isActive} />
          )}
          {navItemsAfterUserMenu.map(renderDesktopLink)}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/shop"
                title="Buy CC"
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                <Coins size={14} className="text-accent" />
                {user.ccCoins.toLocaleString("en-US")}
                <span className="hidden text-xs font-normal text-muted sm:inline">cc</span>
              </Link>

              <div className="hidden sm:block">
                <LevelBadge level={user.level} rankOverrides={rankOverrides} />
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                  className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 transition hover:bg-surface-raised"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-sm font-semibold text-primary ring-2 ring-primary/20">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" width={32} height={32} unoptimized className="object-cover" />
                    ) : (
                      user.username.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="hidden text-sm font-medium text-foreground sm:inline">{user.username}</span>
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
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn-neon rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow"
              >
                Join now
              </Link>
            </>
          )}

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

              {user && (
                <>
                  <p className="mt-2 border-t border-border px-3 pt-3 text-xs font-medium uppercase tracking-wide text-muted">
                    {user.username}
                  </p>
                  {userMenuItems.map(renderMobileLink)}
                </>
              )}

              {navItemsAfterUserMenu.map(renderMobileLink)}

              {!user && (
                <div className="mt-2 flex gap-2 border-t border-border px-3 pt-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-md border border-border px-3.5 py-2 text-center text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-neon flex-1 rounded-md bg-primary px-3.5 py-2 text-center text-sm font-semibold text-white transition hover:bg-primary-glow"
                  >
                    Join now
                  </Link>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
