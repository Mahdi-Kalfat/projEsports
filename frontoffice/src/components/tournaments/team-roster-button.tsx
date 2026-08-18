"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export type TeamRosterMember = { id: string; username: string; avatarUrl: string | null };
export type TeamRosterData = {
  tag: string;
  name: string;
  logoUrl: string | null;
  members: TeamRosterMember[];
};

// A team pill that opens a roster popup on click — same modal shape as
// ClanSettingsButton/EditProfileButton/TeamRegistrationButton.
export function TeamRosterButton({ team }: { team: TeamRosterData }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-foreground transition hover:border-primary hover:text-primary"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[9px] font-semibold text-primary">
          {team.logoUrl ? (
            <Image src={team.logoUrl} alt="" width={20} height={20} unoptimized className="object-contain" />
          ) : (
            team.tag.slice(0, 2)
          )}
        </span>
        {team.name}
        <span className="text-muted">[{team.tag}]</span>
        <span className="text-muted">({team.members.length})</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 bg-black/70" />

          <div className="relative z-10 mx-auto my-8 w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 font-display text-xs font-semibold text-primary">
                  {team.logoUrl ? (
                    <Image src={team.logoUrl} alt="" width={36} height={36} unoptimized className="object-contain" />
                  ) : (
                    team.tag.slice(0, 2)
                  )}
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">{team.name}</h2>
                  <p className="text-xs text-muted">[{team.tag}]</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted transition hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <ul className="mt-4 flex flex-col gap-2">
              {team.members.map((member) => (
                <li key={member.id}>
                  <Link
                    href={`/profile/${member.username}`}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-surface"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt=""
                          width={32}
                          height={32}
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        member.username.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{member.username}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
