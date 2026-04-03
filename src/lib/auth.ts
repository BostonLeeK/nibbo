import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { ensureUserFamily } from "./family";

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      const isEdgeRuntime =
        typeof (globalThis as { EdgeRuntime?: string }).EdgeRuntime === "string" ||
        process.env.NEXT_RUNTIME === "edge";
      if (isEdgeRuntime) {
        return token;
      }
      const userId = String(token.id ?? token.sub ?? "");
      if (!userId) return token;
      token.id = userId;
      const normalizedEmail = typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
      if (normalizedEmail && adminEmails.includes(normalizedEmail)) {
        const existingAdmin = await prisma.$queryRaw<{ id: string }[]>`
          SELECT "id" FROM "Admin" WHERE "userId" = ${userId} LIMIT 1
        `;
        if (existingAdmin.length === 0) {
          await prisma.$executeRaw`
            INSERT INTO "Admin" ("id", "userId", "createdAt")
            VALUES (${randomUUID()}, ${userId}, NOW())
          `;
        }
      }
      const adminRows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "Admin" WHERE "userId" = ${userId} LIMIT 1
      `;
      token.isAdmin = adminRows.length > 0;
      if (!user && token.familyId) return token;
      let familyId = await ensureUserFamily(userId);
      const email = normalizedEmail || null;
      token.familyId = familyId ?? null;
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
        familyId: (token.familyId as string | null | undefined) ?? null,
        isAdmin: Boolean(token.isAdmin),
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
