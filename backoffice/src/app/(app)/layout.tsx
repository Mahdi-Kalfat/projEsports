import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccessBackoffice } from "@/lib/roles";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!canAccessBackoffice(session?.user?.role)) {
    redirect("/login");
  }

  return (
    <AppShell username={session!.user.username} role={session!.user.role}>
      {children}
    </AppShell>
  );
}
