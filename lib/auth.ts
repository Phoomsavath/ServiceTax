import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { messageTranslation, timeToken } from "./constant";
import { ActiveState } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userName: { label: "userName", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.userName || !credentials?.password) {
          throw new Error(messageTranslation.SignInFailed);
        }

        const user = await prisma.user.findUnique({
          where: { userName: credentials.userName },
        });

        if (!user) {
          throw new Error(messageTranslation.NotFound);
        }
        if (user.activeStatus === ActiveState.INACTIVE)
          throw new Error(messageTranslation.SignInFailed);
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error(messageTranslation.SignInFailed);
        }
        if (user.currentToken) {
          const decoded = jwt.decode(user.currentToken) as JwtPayload;

          if (decoded?.exp && decoded.exp > Date.now() / 1000) {
            // **Another session is currently active**
            throw new Error(messageTranslation.SignInDuplicated);
          } else {
            // Token expired → clear it
            await prisma.user.update({
              where: { id: user.id },
              data: { currentToken: null },
            });
          }
        }

        return {
          id: user.id,
          userName: user.userName,
          role: user.role,
          fullName: user.fullName,
          permissions: user.permissions,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: timeToken,
  },
  pages: {
    signIn: "/auth/signin",
  },
  events: {
    async signOut({ token }) {
      // You can use the token info here
      if (token?.id) {
        await prisma.user.update({
          where: { id: token.id },
          data: { currentToken: null },
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        const sessionToken = jwt.sign(
          { userId: user.id },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: timeToken }
        );
        await prisma.user.update({
          where: { id: user.id },
          data: { currentToken: sessionToken },
        });

        token.id = user.id;
        token.userName = user.userName;
        token.role = user.role;
        token.permissions = user.permissions;
        token.fullName = user.fullName;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id;
        session.user.userName = token.userName;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.fullName = token.fullName;
      }
      return session;
    },
  },
};
