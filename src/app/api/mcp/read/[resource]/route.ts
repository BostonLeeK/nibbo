import { getMcpReadContext } from "@/lib/mcp-read-auth";
import { familyXpFromCompletedTaskCount, unlockedFamilyAchievementIds } from "@/lib/family-achievements";
import { kyivStartOfTodayUtc, kyivStartOfWeekUtc } from "@/lib/kyiv-range";
import { prisma } from "@/lib/prisma";
import { boardFullInclude } from "@/lib/task-prisma-include";
import { userCreditedTaskWhere } from "@/lib/task-xp";
import { NextRequest, NextResponse } from "next/server";

const RESOURCES = new Set(["tasks", "events", "shopping", "notes", "task_stats"]);

export async function GET(req: NextRequest, ctx: { params: Promise<{ resource: string }> }) {
  const mcp = await getMcpReadContext(req);
  if (!mcp) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { familyId, userId } = mcp;

  const { resource } = await ctx.params;
  if (!RESOURCES.has(resource)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  switch (resource) {
    case "tasks": {
      const boards = await prisma.taskBoard.findMany({
        where: { familyId },
        include: boardFullInclude,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      return NextResponse.json(boards);
    }
    case "events": {
      const { searchParams } = new URL(req.url);
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      const events = await prisma.event.findMany({
        where: {
          familyId,
          startDate: from ? { gte: new Date(from) } : undefined,
          endDate: to ? { lte: new Date(to) } : undefined,
        },
        include: {
          assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } },
          subscription: { select: { id: true, title: true } },
        },
        orderBy: { startDate: "asc" },
      });
      return NextResponse.json(events);
    }
    case "shopping": {
      const lists = await prisma.shoppingList.findMany({
        where: { familyId },
        include: {
          items: {
            include: {
              addedBy: { select: { id: true, name: true, image: true, color: true, emoji: true } },
            },
            orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json(lists);
    }
    case "notes": {
      const notes = await prisma.note.findMany({
        where: { familyId },
        include: {
          author: { select: { id: true, name: true, image: true, color: true, emoji: true } },
          category: { select: { id: true, name: true, emoji: true, color: true, parentId: true } },
        },
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      });
      return NextResponse.json(notes);
    }
    case "task_stats": {
      const mine = userCreditedTaskWhere(userId);
      const startToday = kyivStartOfTodayUtc();
      const startWeek = kyivStartOfWeekUtc();

      const [myOpen, doneToday, doneWeek, doneTotal, familyCompletedTasks] = await Promise.all([
        prisma.task.count({ where: { ...mine, completed: false, column: { board: { familyId } } } }),
        prisma.task.count({
          where: { ...mine, completed: true, completedAt: { gte: startToday }, column: { board: { familyId } } } },
        ),
        prisma.task.count({
          where: { ...mine, completed: true, completedAt: { gte: startWeek }, column: { board: { familyId } } } },
        ),
        prisma.task.count({ where: { ...mine, completed: true, column: { board: { familyId } } } }),
        prisma.task.count({
          where: { completed: true, column: { board: { familyId } } },
        }),
      ]);

      const familyXp = familyXpFromCompletedTaskCount(familyCompletedTasks);
      const unlockedAchievementIds = unlockedFamilyAchievementIds(familyXp);

      return NextResponse.json({ myOpen, doneToday, doneWeek, doneTotal, familyXp, unlockedAchievementIds });
    }
    default:
      return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
