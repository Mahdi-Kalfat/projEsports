import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — Clutcher",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    // A session can outlive the user it points at (JWT sessions aren't
    // invalidated when the row is deleted) — trusting the JWT alone here would
    // bounce back to "/", which redirects right back for the same reason,
    // looping forever. Verify the account is still real before redirecting.
    const stillExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (stillExists) redirect("/");
  }

  return (
    <AuthShell
      eyebrow="Clutcher"
      title="Welcome"
      accentWord="Back"
      glow="primary"
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-accent transition hover:text-foreground">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
