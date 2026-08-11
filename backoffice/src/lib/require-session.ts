import { auth } from "@/auth";
import { canAccessBackoffice } from "@/lib/roles";

// Server Actions are reachable directly as POST endpoints, bypassing proxy.ts —
// Next's own docs call this out: verify auth inside each Server Action, don't
// rely on the proxy alone (see the Data Security guide linked from the
// proxy.js API reference).
export async function requireBackofficeSession() {
  const session = await auth();
  if (!canAccessBackoffice(session?.user?.role)) {
    throw new Error("Not authorized.");
  }
  return session;
}
