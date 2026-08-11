import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccessBackoffice } from "@/lib/roles";

export default async function Home() {
  const session = await auth();
  redirect(canAccessBackoffice(session?.user?.role) ? "/dashboard" : "/login");
}
