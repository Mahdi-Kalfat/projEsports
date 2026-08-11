import { redirect } from "next/navigation";
import { auth } from "@/auth";

// "/profile" is a stable entry point that doesn't need to know the username up
// front (nav links, "My Profile" menu item) — it just forwards to the real,
// shareable URL. The page itself lives at /profile/[username], shared between
// viewing your own profile and anyone else's.
export default async function ProfileRedirectPage() {
  const session = await auth();
  redirect(`/profile/${session!.user.username}`);
}
