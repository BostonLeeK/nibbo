import { auth } from "@/lib/auth";
import { generateMcpReadTokenPlain, hashMcpReadToken } from "@/lib/mcp-token-hash";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.mcpReadToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tokens: rows });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plain = generateMcpReadTokenPlain();
  const tokenHash = hashMcpReadToken(plain);

  const row = await prisma.mcpReadToken.create({
    data: { userId: session.user.id, tokenHash },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ id: row.id, token: plain, createdAt: row.createdAt.toISOString() });
}
