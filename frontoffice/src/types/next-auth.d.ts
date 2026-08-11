import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
  }
}
