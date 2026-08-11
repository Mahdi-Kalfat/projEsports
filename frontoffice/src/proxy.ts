import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Built from the lightweight authConfig, not the full auth.ts export — keeps Prisma
// and its query-engine binary out of the middleware bundle. JWT sessions are
// self-verified from the signed cookie, so no DB access is needed here. Mirrors
// backoffice/src/proxy.ts's rationale.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/", "/login", "/register"];
const REDIRECT_IF_AUTHED = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;

  if (REDIRECT_IF_AUTHED.includes(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|games|ranks|uploads).*)"],
};
