import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/login";
import { canUseFrontOffice } from "@/lib/roles";
import { authConfig } from "@/auth.config";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class BannedError extends CredentialsSignin {
  code = "banned";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Unlike backoffice's authorize(), there's no role gate here — every role
      // (including staff accounts) can use the front office. Only an active ban
      // blocks sign-in, same as backoffice.
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

        if (!canUseFrontOffice(user.banned, user.bannedUntil)) throw new BannedError();

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
