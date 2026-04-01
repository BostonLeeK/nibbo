import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const category = await prisma.noteCategory.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: String(body.name || "").trim() || "Категорія" }),
      ...(body.emoji !== undefined && { emoji: body.emoji || "📂" }),
      ...(body.color !== undefined && { color: body.color || "#f5f3ff" }),
      ...(body.parentId !== undefined && { parentId: body.parentId || null }),
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const categories = await prisma.noteCategory.findMany({ select: { id: true, parentId: true } });
  const childrenMap = new Map<string, string[]>();
  for (const c of categories) {
    if (!c.parentId) continue;
    if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
    childrenMap.get(c.parentId)!.push(c.id);
  }

  const stack = [id];
  const toDelete: string[] = [];
  while (stack.length) {
    const cur = stack.pop()!;
    toDelete.push(cur);
    const kids = childrenMap.get(cur) || [];
    for (const k of kids) stack.push(k);
  }

  await prisma.$transaction([
    prisma.note.updateMany({ where: { categoryId: { in: toDelete } }, data: { categoryId: null } }),
    prisma.noteCategory.deleteMany({ where: { id: { in: toDelete } } }),
  ]);

  return NextResponse.json({ success: true });
}
