import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { taskRelationInclude } from "@/lib/task-prisma-include";
import { POINTS_PER_TASK_COMPLETION } from "@/lib/task-points";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (body.type === "move-task") {
    const canMove = await prisma.task.findFirst({
      where: { id, column: { board: { familyId } } },
      select: { id: true },
    });
    if (!canMove) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const targetColumn = await prisma.taskColumn.findFirst({
      where: { id: body.columnId, board: { familyId } },
      select: { id: true },
    });
    if (!targetColumn) return NextResponse.json({ error: "Column not found" }, { status: 404 });
    const task = await prisma.task.update({
      where: { id },
      data: { columnId: body.columnId, order: body.order },
      include: taskRelationInclude,
    });
    return NextResponse.json(task);
  }

  const existing = await prisma.task.findFirst({ where: { id, column: { board: { familyId } } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let assigneeSeenAt: Date | null | undefined = undefined;
  if (body.assigneeId !== undefined) {
    const nextAssignee =
      body.assigneeId === null || body.assigneeId === "" ? null : String(body.assigneeId);
    if (nextAssignee !== existing.assigneeId) {
      if (!nextAssignee) assigneeSeenAt = null;
      else if (nextAssignee === session.user.id) assigneeSeenAt = new Date();
      else assigneeSeenAt = null;
    }
  }

  const data: Parameters<typeof prisma.task.update>[0]["data"] = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.completed !== undefined) {
    data.completed = body.completed;
    if (body.completed) {
      if (!existing.completed) data.completedAt = new Date();
    } else {
      data.completedAt = null;
    }
  }
  if (body.labels !== undefined) data.labels = body.labels;
  if (body.order !== undefined) data.order = body.order;
  if (body.columnId !== undefined) data.columnId = body.columnId;
  if (body.columnId !== undefined) {
    const targetColumn = await prisma.taskColumn.findFirst({
      where: { id: body.columnId, board: { familyId } },
      select: { id: true },
    });
    if (!targetColumn) return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }
  if ("dueDate" in body) {
    data.dueDate =
      body.dueDate === null || body.dueDate === ""
        ? null
        : body.dueDate
          ? new Date(body.dueDate as string)
          : null;
  }
  if (body.assigneeId !== undefined) {
    data.assigneeId =
      body.assigneeId === null || body.assigneeId === "" ? null : String(body.assigneeId);
    if (data.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: data.assigneeId, familyId },
        select: { id: true },
      });
      if (!assignee) return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
    }
  }
  if (assigneeSeenAt !== undefined) data.assigneeSeenAt = assigneeSeenAt;

  const task = await prisma.task.update({
    where: { id },
    data,
    include: taskRelationInclude,
  });

  const awardedPoints =
    body.completed === true && existing.completed === false ? POINTS_PER_TASK_COMPLETION : 0;

  return NextResponse.json({ ...task, awardedPoints });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.task.findFirst({ where: { id, column: { board: { familyId } } }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
