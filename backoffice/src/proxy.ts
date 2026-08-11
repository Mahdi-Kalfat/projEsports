import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { canAccessBackoffice } from "@/lib/roles";

// Built from the lightweight authConfig, not the full auth.ts export — this keeps
// Prisma and its query-engine binary out of the middleware bundle. JWT sessions are
// self-verified from the signed cookie, so no DB access is needed here anyway.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isAuthorized = canAccessBackoffice(req.auth?.user?.role);

  if (isPublicPath) {
    if (isAuthorized) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isAuthorized) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // /uploads is excluded: tournament/event/shop/marketplace images saved by
  // saveUploadedImage are meant to be publicly viewable (the front office renders
  // them directly, and proxies through them — see frontoffice/next.config.ts).
  // Gating them behind backoffice auth made that proxy silently redirect to
  // backoffice's /login and leak its Set-Cookie back to the front office's origin.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
