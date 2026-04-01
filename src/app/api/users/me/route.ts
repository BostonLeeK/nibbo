import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, color: true, emoji: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(body.name !== undefined && { name: String(body.name).trim() || null }),
      ...(body.emoji !== undefined && { emoji: String(body.emoji) }),
      ...(body.color !== undefined && { color: String(body.color) }),
      ...(body.image !== undefined && { image: body.image ? String(body.image) : null }),
    },
    select: { id: true, name: true, email: true, image: true, color: true, emoji: true },
  });

  return NextResponse.json(user);
}
