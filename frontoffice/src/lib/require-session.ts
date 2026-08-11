import { auth } from "@/auth";

// Server Actions are reachable directly as POST endpoints, bypassing proxy.ts —
// verify auth inside each Server Action, don't rely on the proxy alone. Mirrors
// backoffice/src/lib/require-session.ts.
export async function requireFrontOfficeSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authorized.");
  }
  return session;
}
