import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { kyivStartOfTodayUtc, kyivStartOfWeekUtc } from "@/lib/kyiv-range";
import { prisma } from "@/lib/prisma";
import { familyXpFromCompletedTaskCount, unlockedFamilyAchievementIds } from "@/lib/family-achievements";
import { userCreditedTaskWhere } from "@/lib/task-xp";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const mine = userCreditedTaskWhere(userId);
  const startToday = kyivStartOfTodayUtc();
  const startWeek = kyivStartOfWeekUtc();

  const [myOpen, doneToday, doneWeek, doneTotal, familyCompletedTasks] = await Promise.all([
    prisma.task.count({ where: { ...mine, completed: false, column: { board: { familyId } } } }),
    prisma.task.count({
      where: { ...mine, completed: true, completedAt: { gte: startToday }, column: { board: { familyId } } },
    }),
    prisma.task.count({
      where: { ...mine, completed: true, completedAt: { gte: startWeek }, column: { board: { familyId } } },
    }),
    prisma.task.count({ where: { ...mine, completed: true, column: { board: { familyId } } } }),
    prisma.task.count({
      where: { completed: true, column: { board: { familyId } } },
    }),
  ]);

  const familyXp = familyXpFromCompletedTaskCount(familyCompletedTasks);
  const unlockedAchievementIds = unlockedFamilyAchievementIds(familyXp);

  return NextResponse.json({ myOpen, doneToday, doneWeek, doneTotal, familyXp, unlockedAchievementIds });
}

