"use server";

import { AuthError } from "next-auth";
import { CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validation/login";

export type LoginActionState = {
  error?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  banned: "This account has been banned.",
  access_denied: "This account does not have access to the admin back office.",
};

export async function login(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { error: ERROR_MESSAGES[error.code ?? ""] ?? "Invalid email or password." };
    }
    if (error instanceof AuthError) {
      return { error: "Something went wrong. Please try again." };
    }
    throw error;
  }
}
