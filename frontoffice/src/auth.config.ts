import type { NextAuthConfig } from "next-auth";

// Split out from auth.ts so proxy.ts (Next's middleware) can build a lightweight
// `auth()` from just this config, without pulling in the Credentials provider's
// Prisma-based `authorize()` — and with it, the Prisma query-engine binary — into
// the middleware bundle. Mirrors backoffice/src/auth.config.ts.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  // Browser cookies aren't port-scoped — only domain-scoped — so on localhost this
  // app and backoffice (both Auth.js, both defaulting to "authjs.session-token")
  // would silently clobber each other's session cookie the moment any response
  // from one leaks a Set-Cookie header while the browser is pointed at the other
  // (e.g. the /uploads image proxy in next.config.ts). Distinct names keep the
  // two apps' sessions fully independent regardless of what backoffice does.
  cookies: {
    sessionToken: { name: "fo-authjs.session-token" },
    callbackUrl: { name: "fo-authjs.callback-url" },
    csrfToken: { name: "fo-authjs.csrf-token" },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      return session;
    },
  },
};
