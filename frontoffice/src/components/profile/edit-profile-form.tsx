"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, type UpdateProfileState } from "@/app/(app)/profile/actions";
import { ThemePicker } from "./theme-picker";

const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const FILE_FIELD_CLASS = `${FIELD_CLASS} file:mr-3 file:rounded file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:font-medium file:text-primary`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

const initialState: UpdateProfileState = {};

export function EditProfileForm({
  defaultFullName,
  defaultPhone,
  defaultBio,
  defaultTheme,
  defaultInventoryPublic,
  onSaved,
}: {
  defaultFullName: string;
  defaultPhone: string;
  defaultBio: string;
  defaultTheme: string;
  defaultInventoryPublic: boolean;
  onSaved?: () => void;
}) {
  const [state, formAction] = useActionState(updateProfile, initialState);

  useEffect(() => {
    if (state.success) onSaved?.();
  }, [state.success, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="text-xs text-muted">
        Full name
        <input type="text" name="fullName" maxLength={120} defaultValue={defaultFullName} className={FIELD_CLASS} />
      </label>

      <label className="text-xs text-muted">
        Phone
        <input type="tel" name="phone" maxLength={30} defaultValue={defaultPhone} className={FIELD_CLASS} />
      </label>

      <label className="text-xs text-muted">
        About me
        <textarea
          name="bio"
          rows={3}
          maxLength={500}
          placeholder="Tell other players a bit about yourself…"
          defaultValue={defaultBio}
          className={FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Avatar
        <input
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={FILE_FIELD_CLASS}
        />
      </label>

      <label className="text-xs text-muted">
        Banner
        <input
          type="file"
          name="banner"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={FILE_FIELD_CLASS}
        />
      </label>

      <div className="text-xs text-muted">
        Profile color
        <div className="mt-1.5">
          <ThemePicker defaultValue={defaultTheme} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          name="inventoryPublic"
          defaultChecked={defaultInventoryPublic}
          className="accent-primary"
        />
        Make my inventory public
      </label>

      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
      {state.success && <p className="text-xs text-success">Profile updated.</p>}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
