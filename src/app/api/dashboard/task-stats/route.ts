import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { kyivStartOfTodayUtc, kyivStartOfWeekUtc } from "@/lib/kyiv-range";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const mine = { OR: [{ assigneeId: userId }, { creatorId: userId }] };
  const startToday = kyivStartOfTodayUtc();
  const startWeek = kyivStartOfWeekUtc();

  const [myOpen, doneToday, doneWeek, doneTotal] = await Promise.all([
    prisma.task.count({ where: { ...mine, completed: false, column: { board: { familyId } } } }),
    prisma.task.count({
      where: { ...mine, completed: true, completedAt: { gte: startToday }, column: { board: { familyId } } },
    }),
    prisma.task.count({
      where: { ...mine, completed: true, completedAt: { gte: startWeek }, column: { board: { familyId } } },
    }),
    prisma.task.count({ where: { ...mine, completed: true, column: { board: { familyId } } } }),
  ]);

  return NextResponse.json({ myOpen, doneToday, doneWeek, doneTotal });
}

