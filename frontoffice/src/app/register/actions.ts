"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import { registerSchema } from "@/lib/validation/register";
import { createUniqueFriendCode } from "@/lib/friend-code";

export type RegisterActionState = {
  error?: string;
};

export async function register(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { username, password, fullName, phone } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    return {
      error:
        existing.email === email
          ? "An account with that email already exists."
          : "That username is taken.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const friendCode = await createUniqueFriendCode();
  await prisma.user.create({
    data: { username, email, passwordHash, fullName, phone, friendCode },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { error: "Account created — please sign in." };
    }
    if (error instanceof AuthError) {
      return { error: "Account created — please sign in." };
    }
    throw error;
  }
}
