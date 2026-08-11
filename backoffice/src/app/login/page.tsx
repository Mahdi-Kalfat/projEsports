import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccessBackoffice } from "@/lib/roles";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Back Office",
};

export default async function LoginPage() {
  const session = await auth();
  if (canAccessBackoffice(session?.user?.role)) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(255,30,60,0.16), transparent 60%), radial-gradient(45% 40% at 90% 100%, rgba(0,229,255,0.10), transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Esports Tournament Platform
          </p>
          <h1 className="mt-3 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
            Back <span className="neon-text">Office</span>
          </h1>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-raised p-8 shadow-2xl">
          <div
            aria-hidden
            className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{ boxShadow: "0 0 8px 1px rgba(255,30,60,0.8)" }}
          />
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Staff access only — accounts are provisioned by an administrator.
          There is no self-service sign-up for the back office.
        </p>
      </div>
    </main>
  );
}
