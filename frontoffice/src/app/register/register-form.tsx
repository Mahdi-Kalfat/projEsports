"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register, type RegisterActionState } from "./actions";

const initialState: RegisterActionState = {};

export function RegisterForm() {
  const [state, formAction] = useActionState(register, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Username" name="username" type="text" autoComplete="username" placeholder="playerOne" />
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@esportweb.tn" />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <Field
          label="Confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </div>
      <Field
        label="Full name (optional)"
        name="fullName"
        type="text"
        autoComplete="name"
        placeholder="Jane Doe"
        required={false}
      />
      <Field
        label="Phone (optional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+216 00 000 000"
        required={false}
      />

      <p role="alert" aria-live="polite" className="min-h-[1.25rem] text-sm text-primary-glow">
        {state.error}
      </p>

      <SubmitButton />
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wide text-muted">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm font-normal tracking-normal text-foreground outline-none transition placeholder:text-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon mt-1 rounded-md bg-primary py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}
