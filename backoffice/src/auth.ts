import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/login";
import { canAccessBackoffice } from "@/lib/roles";
import { isRestrictionActive } from "@/lib/restrictions";
import { authConfig } from "@/auth.config";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class BannedError extends CredentialsSignin {
  code = "banned";
}

class AccessDeniedError extends CredentialsSignin {
  code = "access_denied";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) throw new InvalidCredentialsError();
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) throw new InvalidCredentialsError();

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) throw new InvalidCredentialsError();

        if (isRestrictionActive(user.banned, user.bannedUntil)) throw new BannedError();
        if (!canAccessBackoffice(user.role)) throw new AccessDeniedError();

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          subRoles: user.subRoles,
        };
      },
    }),
  ],
});
