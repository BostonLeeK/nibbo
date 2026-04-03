import { prisma } from "@/lib/prisma";

export async function isUserAdmin(userId: string) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Admin" WHERE "userId" = ${userId} LIMIT 1
  `;
  return rows.length > 0;
}

export async function getAdminIdByUser(userId: string) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Admin" WHERE "userId" = ${userId} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}
