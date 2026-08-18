"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { X, Search, Trash2 } from "lucide-react";
import {
  submitTournamentRegistration,
  searchTournamentCandidates,
  previewTeamTag,
  type SubmitRegistrationState,
  type UserSearchResult,
} from "@/app/(app)/tournaments/actions";

const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon w-full rounded-md bg-primary py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Submitting…" : "Submit for approval"}
    </button>
  );
}

const initialState: SubmitRegistrationState = {};

// Trigger button + popup form, bundled as one component — same shape as
// ClanSettingsButton/EditProfileButton. Submitting creates a PENDING
// TournamentRegistration; nothing is actually registered until an admin
// approves it in the back office (see submitTournamentRegistration).
export function TeamRegistrationButton({
  tournamentId,
  maxTeamSize,
}: {
  tournamentId: string;
  maxTeamSize: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [tagPreview, setTagPreview] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [members, setMembers] = useState<UserSearchResult[]>([]);
  const [searching, startSearch] = useTransition();

  const boundAction = submitTournamentRegistration.bind(null, tournamentId);
  const [state, formAction] = useActionState(boundAction, initialState);

  // +1 for the captain, who's always on the roster but never in `members`.
  const rosterSize = members.length + 1;
  const atCap = maxTeamSize !== null && rosterSize >= maxTeamSize;

  useEffect(() => {
    if (!open) return;
    previewTeamTag(tournamentId).then(setTagPreview);
  }, [open, tournamentId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!state.success) return;
    setOpen(false);
    setMembers([]);
    setQuery("");
    setResults([]);
  }, [state.success]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || atCap) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startSearch(async () => {
        const found = await searchTournamentCandidates(tournamentId, trimmed);
        setResults(found.filter((u) => !members.some((m) => m.id === u.id)));
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, tournamentId, members, atCap]);

  function addMember(user: UserSearchResult) {
    if (atCap) return;
    setMembers((prev) => (prev.some((m) => m.id === user.id) ? prev : [...prev, user]));
    setResults((prev) => prev.filter((u) => u.id !== user.id));
    setQuery("");
  }

  function removeMember(userId: string) {
    setMembers((prev) => prev.filter((m) => m.id !== userId));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-neon w-full rounded-md bg-primary py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary-glow"
      >
        Participate
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 bg-black/70" />

          <div className="relative z-10 mx-auto my-8 w-full max-w-lg rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Register your team</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted transition hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              An admin reviews every team registration before it&apos;s confirmed.
            </p>

            <form action={formAction} className="mt-4 flex flex-col gap-3">
              <label className="text-xs text-muted">
                Team name
                <input
                  type="text"
                  name="teamName"
                  required
                  maxLength={60}
                  placeholder="Your squad's name"
                  className={FIELD_CLASS}
                />
              </label>

              <div className="text-xs text-muted">
                Team tag
                <input
                  type="text"
                  value={tagPreview ?? "…"}
                  disabled
                  readOnly
                  className={`${FIELD_CLASS} cursor-not-allowed opacity-70`}
                />
                <p className="mt-1 text-[11px] text-muted">Generated automatically from the tournament&apos;s region.</p>
              </div>

              <label className="text-xs text-muted">
                Team logo (optional)
                <input
                  type="file"
                  name="teamLogo"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className={`${FIELD_CLASS} file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary`}
                />
              </label>

              <div className="text-xs text-muted">
                <div className="flex items-center justify-between">
                  <span>Team members</span>
                  {maxTeamSize !== null && (
                    <span className="text-[11px] tabular-nums">
                      {rosterSize}/{maxTeamSize}
                    </span>
                  )}
                </div>
                <div className="relative mt-1">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={atCap ? "Team is full" : "Search by username…"}
                    disabled={atCap}
                    className={`${FIELD_CLASS} pl-8 disabled:cursor-not-allowed disabled:opacity-60`}
                  />
                  {(results.length > 0 || searching) && (
                    <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-surface shadow-xl">
                      {searching ? (
                        <p className="px-3 py-2 text-xs text-muted">Searching…</p>
                      ) : (
                        results.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => addMember(user)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-primary/10"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                              {user.avatarUrl ? (
                                <Image src={user.avatarUrl} alt="" width={24} height={24} unoptimized className="object-cover" />
                              ) : (
                                user.username.slice(0, 1).toUpperCase()
                              )}
                            </span>
                            {user.username}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {members.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                          {member.avatarUrl ? (
                            <Image src={member.avatarUrl} alt="" width={24} height={24} unoptimized className="object-cover" />
                          ) : (
                            member.username.slice(0, 1).toUpperCase()
                          )}
                        </span>
                        <span className="flex-1 truncate">{member.username}</span>
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          aria-label={`Remove ${member.username}`}
                          className="text-muted transition hover:text-primary"
                        >
                          <Trash2 size={14} />
                        </button>
                        <input type="hidden" name="memberIds" value={member.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
              <SubmitButton />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
