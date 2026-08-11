import type { NextAuthConfig } from "next-auth";

// Split out from auth.ts so proxy.ts (Next's middleware) can build a lightweight
// `auth()` from just this config, without pulling in the Credentials provider's
// Prisma-based `authorize()` — and with it, the Prisma query-engine binary — into
// the middleware bundle.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.subRoles = user.subRoles;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.subRoles = token.subRoles;
      return session;
    },
  },
};
