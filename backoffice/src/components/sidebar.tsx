"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav-items";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0 ${
          open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-5">
          <Link href="/dashboard" className="flex items-baseline gap-1.5" onClick={onClose}>
            <span className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
              Back
            </span>
            <span className="neon-text font-display text-sm font-bold uppercase tracking-wide">
              Office
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            onClick={onClose}
            className="text-muted lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border-primary bg-surface-raised text-foreground"
                        : "border-transparent text-muted hover:border-border hover:bg-surface-raised/60 hover:text-foreground"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-primary" : "text-muted group-hover:text-foreground"}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border px-5 py-4 text-xs text-muted">
          Clutcher
        </div>
      </aside>
    </>
  );
}
