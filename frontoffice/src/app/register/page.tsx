import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account — Clutcher",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    // See login/page.tsx — a stale session (deleted user, still-valid JWT)
    // must not redirect away from here, or it loops against "/".
    const stillExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (stillExists) redirect("/");
  }

  return (
    <AuthShell
      eyebrow="Clutcher"
      title="Join the"
      accentWord="Arena"
      glow="accent"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent transition hover:text-foreground">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
