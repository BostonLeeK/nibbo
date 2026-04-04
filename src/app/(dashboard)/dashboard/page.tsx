import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/shared/DashboardClient";
import { kyivStartOfTodayUtc, kyivStartOfWeekUtc } from "@/lib/kyiv-range";
import { redirect } from "next/navigation";
import { ensureUserFamily } from "@/lib/family";
import { AUTO_BILLING_MARKER } from "@/lib/subscription-calendar";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const familyId = await ensureUserFamily(userId);
  if (!familyId) redirect("/login");
  const mine = { OR: [{ assigneeId: userId }, { creatorId: userId }] };

  const startToday = kyivStartOfTodayUtc();
  const startWeek = kyivStartOfWeekUtc();

  const [taskCount, eventCount, shoppingCount, myOpen, doneToday, doneWeek, doneTotal] =
    await Promise.all([
      prisma.task.count({ where: { completed: false, column: { board: { familyId } } } }),
      prisma.event.count({
        where: {
          familyId,
          startDate: { gte: new Date() },
          NOT: { description: { startsWith: AUTO_BILLING_MARKER } },
        },
      }),
      prisma.shoppingItem.count({ where: { checked: false, list: { familyId } } }),
      prisma.task.count({ where: { ...mine, completed: false, column: { board: { familyId } } } }),
      prisma.task.count({
        where: { ...mine, completed: true, completedAt: { gte: startToday }, column: { board: { familyId } } },
      }),
      prisma.task.count({
        where: { ...mine, completed: true, completedAt: { gte: startWeek }, column: { board: { familyId } } },
      }),
      prisma.task.count({ where: { ...mine, completed: true, column: { board: { familyId } } } }),
    ]);

  const upcomingEvents = await prisma.event.findMany({
    where: {
      familyId,
      startDate: { gte: new Date() },
      NOT: { description: { startsWith: AUTO_BILLING_MARKER } },
    },
    include: { assignee: { select: { name: true, image: true, color: true, emoji: true } } },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  const recentTasks = await prisma.task.findMany({
    where: { completed: false, assigneeId: userId, column: { board: { familyId } } },
    include: { assignee: { select: { name: true, image: true, color: true, emoji: true } } },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 5,
  });

  return (
    <DashboardClient
      stats={{ taskCount, eventCount, shoppingCount }}
      personalTaskStats={{ myOpen, doneToday, doneWeek, doneTotal }}
      upcomingEvents={upcomingEvents}
      recentTasks={recentTasks}
    />
  );
}
