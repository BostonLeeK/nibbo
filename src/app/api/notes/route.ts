import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.note.findMany({
    include: {
      author: { select: { id: true, name: true, image: true, color: true, emoji: true } },
      category: { select: { id: true, name: true, emoji: true, color: true, parentId: true } },
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const note = await prisma.note.create({
    data: {
      title: body.title,
      content: body.content,
      emoji: body.emoji || "📓",
      color: body.color || "#faf3e0",
      pinned: body.pinned || false,
      authorId: session.user.id,
      categoryId: body.categoryId || null,
      tags: body.tags || [],
    },
    include: {
      author: { select: { id: true, name: true, image: true, color: true, emoji: true } },
      category: { select: { id: true, name: true, emoji: true, color: true, parentId: true } },
    },
  });

  return NextResponse.json(note);
}
