import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

function allowedEmailSet(): Set<string> | null {
  const raw = process.env.AUTH_ALLOWED_EMAILS?.trim();
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? new Set(list) : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allow = allowedEmailSet();
      if (!allow) return true;
      const email = user.email?.trim().toLowerCase();
      if (!email) return false;
      return allow.has(email);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      const prev = session.user;
      session.user = {
        ...(prev ?? {}),
        id: String(token.id ?? token.sub ?? ""),
        name: (token.name as string | null | undefined) ?? prev?.name ?? null,
        email:
          (typeof token.email === "string" ? token.email : prev?.email) ?? "",
        image: (token.picture as string | null | undefined) ?? prev?.image ?? null,
        emailVerified: prev?.emailVerified ?? null,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
