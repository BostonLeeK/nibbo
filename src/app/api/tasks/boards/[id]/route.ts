import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardFullInclude } from "@/lib/task-prisma-include";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const board = await prisma.taskBoard.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.description !== undefined && { description: body.description }),
      ...(typeof body.order === "number" && { order: body.order }),
    },
    include: boardFullInclude,
  });

  return NextResponse.json(board);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.taskBoard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
