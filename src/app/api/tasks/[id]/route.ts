import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Move task between columns
  if (body.type === "move-task") {
    const task = await prisma.task.update({
      where: { id },
      data: { columnId: body.columnId, order: body.order },
    });
    return NextResponse.json(task);
  }

  // Update task
  const task = await prisma.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      assigneeId: body.assigneeId,
      labels: body.labels,
      completed: body.completed,
      order: body.order,
      columnId: body.columnId,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } },
      creator: { select: { id: true, name: true, image: true, color: true, emoji: true } },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "column") {
    await prisma.taskColumn.delete({ where: { id } });
  } else if (type === "board") {
    await prisma.taskBoard.delete({ where: { id } });
  } else {
    await prisma.task.delete({ where: { id } });
  }

  return NextResponse.json({ success: true });
}
