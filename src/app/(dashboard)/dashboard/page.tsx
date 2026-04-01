import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/shared/DashboardClient";
import { kyivStartOfTodayUtc, kyivStartOfWeekUtc } from "@/lib/kyiv-range";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const mine = { OR: [{ assigneeId: userId }, { creatorId: userId }] };

  const startToday = kyivStartOfTodayUtc();
  const startWeek = kyivStartOfWeekUtc();

  const [taskCount, eventCount, shoppingCount, myOpen, doneToday, doneWeek, doneTotal] =
    await Promise.all([
      prisma.task.count({ where: { completed: false } }),
      prisma.event.count({ where: { startDate: { gte: new Date() } } }),
      prisma.shoppingItem.count({ where: { checked: false } }),
      prisma.task.count({ where: { ...mine, completed: false } }),
      prisma.task.count({
        where: { ...mine, completed: true, completedAt: { gte: startToday } },
      }),
      prisma.task.count({
        where: { ...mine, completed: true, completedAt: { gte: startWeek } },
      }),
      prisma.task.count({ where: { ...mine, completed: true } }),
    ]);

  const upcomingEvents = await prisma.event.findMany({
    where: { startDate: { gte: new Date() } },
    include: { assignee: { select: { name: true, image: true, color: true, emoji: true } } },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  const recentTasks = await prisma.task.findMany({
    where: { completed: false, ...mine },
    include: { assignee: { select: { name: true, image: true, color: true, emoji: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <DashboardClient
      stats={{ taskCount, eventCount, shoppingCount }}
      personalTaskStats={{ myOpen, doneToday, doneWeek, doneTotal }}
      upcomingEvents={upcomingEvents}
      recentTasks={recentTasks}
      userName={session.user.name ?? "Друже"}
    />
  );
}
