import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { boardFullInclude, columnWithTasksInclude, taskRelationInclude } from "@/lib/task-prisma-include";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boards = await prisma.taskBoard.findMany({
    include: boardFullInclude,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(boards);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.type === "board") {
    const maxOrder = await prisma.taskBoard.aggregate({ _max: { order: true } });
    const order = (maxOrder._max.order ?? -1) + 1;
    const board = await prisma.taskBoard.create({
      data: {
        name: body.name,
        description: body.description,
        emoji: body.emoji || "📋",
        color: body.color || "#f43f5e",
        order,
      },
      include: boardFullInclude,
    });
    return NextResponse.json(board);
  }

  if (body.type === "column") {
    const column = await prisma.taskColumn.create({
      data: {
        name: body.name,
        emoji: body.emoji || "📝",
        color: body.color || "#e7e5e4",
        boardId: body.boardId,
        order: body.order ?? 0,
      },
      include: columnWithTasksInclude,
    });
    return NextResponse.json(column);
  }

  if (body.type === "task") {
    const assigneeId = body.assigneeId || undefined;
    const assigneeSeenAt =
      assigneeId && assigneeId !== session.user.id ? null : assigneeId ? new Date() : null;

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority || "MEDIUM",
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        columnId: body.columnId,
        assigneeId,
        assigneeSeenAt,
        creatorId: session.user.id,
        labels: body.labels || [],
        order: body.order || 0,
      },
      include: taskRelationInclude,
    });
    return NextResponse.json(task);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
