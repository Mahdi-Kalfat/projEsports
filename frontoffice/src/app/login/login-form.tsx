"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginActionState } from "./actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@clutcher.tn" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
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
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-wide text-muted">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
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
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
