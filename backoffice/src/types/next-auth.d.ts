import type { DefaultSession } from "next-auth";
import type { Role, SubRole } from "@/generated/prisma";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: Role;
    subRoles: SubRole[];
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      subRoles: SubRole[];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: Role;
    subRoles: SubRole[];
  }
}
