"use client";

import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { EditProfileForm } from "./edit-profile-form";

export function EditProfileButton({
  defaultFullName,
  defaultPhone,
  defaultBio,
  defaultTheme,
  defaultInventoryPublic,
}: {
  defaultFullName: string;
  defaultPhone: string;
  defaultBio: string;
  defaultTheme: string;
  defaultInventoryPublic: boolean;
}) {
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
        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
      >
        <Pencil size={16} />
        Edit Profile
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 bg-black/70" />

          <div className="relative z-10 mx-auto my-8 w-full max-w-lg rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Edit profile</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted transition hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4">
              <EditProfileForm
                defaultFullName={defaultFullName}
                defaultPhone={defaultPhone}
                defaultBio={defaultBio}
                defaultTheme={defaultTheme}
                defaultInventoryPublic={defaultInventoryPublic}
                onSaved={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
