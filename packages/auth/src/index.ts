import type { DefaultSession, NextAuthOptions } from "next-auth";
import prisma from "@spark/db";
import { getUserById } from "./data/user";

import { UserRole } from "@prisma/client";
import { getAccountByUserId } from "./data/account";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "./schemas";
import { getUserByEmail } from "./data/user";
import bcrypt from "bcryptjs";
import type { Provider } from "next-auth/providers/index";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "Credentials",
    type: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const validatedFields = LoginSchema.safeParse(credentials);

      if (validatedFields.success) {
        const { email, password } = validatedFields.data;

        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) return user;
      }

      return null;
    },
  }),
];

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
    error: "/error",
    signOut: "/logout",
  },
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id);

      // Prevent sign in without email verification
      // if (!existingUser?.emailVerified) return false

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      //   if (session.user) {
      //     session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      //   }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email;
        // session.user.isOAuth = token.isOAuth as boolean;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;
      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;
      const existingAccount = await getAccountByUserId(existingUser.id);
      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      //   token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token;
    },
  },
  providers,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
};
