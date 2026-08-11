import { redirect } from "next/navigation";
import { auth } from "@/auth";

// "/inventory" is a stable entry point (navbar link) that doesn't need to know
// the username up front — forwards to the real, shareable URL at
// /inventory/[username], mirroring "/profile"'s redirect to /profile/[username].
export default async function InventoryRedirectPage() {
  const session = await auth();
  redirect(`/inventory/${session!.user.username}`);
}
