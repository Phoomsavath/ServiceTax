import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: string;
      userName: string;
      fullName?: string;
      permissions?: Json;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    role: string;
    userName: string;
    fullName?: string;
    permissions?: Json;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: string;
    userName: string;
    fullName?: string;
    permissions?: Json;
  }
}
