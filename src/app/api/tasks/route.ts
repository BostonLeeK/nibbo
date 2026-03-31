import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const boards = await prisma.taskBoard.findMany({
    include: {
      columns: {
        include: {
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } },
              creator: { select: { id: true, name: true, image: true, color: true, emoji: true } },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(boards);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.type === "board") {
    const board = await prisma.taskBoard.create({
      data: {
        name: body.name,
        description: body.description,
        emoji: body.emoji || "📋",
        color: body.color || "#f43f5e",
      },
      include: { columns: { include: { tasks: true } } },
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
        order: body.order || 0,
      },
      include: { tasks: true },
    });
    return NextResponse.json(column);
  }

  if (body.type === "task") {
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority || "MEDIUM",
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        columnId: body.columnId,
        assigneeId: body.assigneeId || undefined,
        creatorId: session.user.id,
        labels: body.labels || [],
        order: body.order || 0,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } },
        creator: { select: { id: true, name: true, image: true, color: true, emoji: true } },
      },
    });
    return NextResponse.json(task);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
