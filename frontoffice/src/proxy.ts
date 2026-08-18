import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Built from the lightweight authConfig, not the full auth.ts export — keeps Prisma
// and its query-engine binary out of the middleware bundle. JWT sessions are
// self-verified from the signed cookie, so no DB access is needed here. Mirrors
// backoffice/src/proxy.ts's rationale.
const { auth } = NextAuth(authConfig);

// Guest-browsable: home, tournaments (list + detail), shop, marketplace
// (listing browse only — /marketplace/new and /marketplace/mine stay
// gated below, since neither makes sense without an account), battle-pass,
// rewards. Each of those pages/layouts handles a null session itself
// (read-only view + sign-in CTAs instead of real actions) — see
// (app)/layout.tsx and lib/marketplace.ts's MARKETPLACE_MIN_LEVEL gate,
// which is a separate, logged-in-only restriction from this guest gate.
const PUBLIC_PATHS = ["/", "/login", "/register", "/tournaments", "/shop", "/marketplace", "/battle-pass", "/rewards"];
const PUBLIC_PREFIXES = ["/tournaments/"];
const REDIRECT_IF_AUTHED = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  if (REDIRECT_IF_AUTHED.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const isPublic =
    PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublic) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo-clutcher.png|logo-clutcher-mark.png|games|ranks|uploads|proof-uploads).*)"],
};
