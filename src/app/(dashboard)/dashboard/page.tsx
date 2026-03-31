import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/shared/DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [taskCount, eventCount, shoppingCount] = await Promise.all([
    prisma.task.count({ where: { completed: false } }),
    prisma.event.count({ where: { startDate: { gte: new Date() } } }),
    prisma.shoppingItem.count({ where: { checked: false } }),
  ]);

  const upcomingEvents = await prisma.event.findMany({
    where: { startDate: { gte: new Date() } },
    include: { assignee: { select: { name: true, image: true, color: true, emoji: true } } },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  const recentTasks = await prisma.task.findMany({
    where: { completed: false },
    include: { assignee: { select: { name: true, image: true, color: true, emoji: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <DashboardClient
      stats={{ taskCount, eventCount, shoppingCount }}
      upcomingEvents={upcomingEvents}
      recentTasks={recentTasks}
      userName={session.user.name ?? "Друже"}
    />
  );
}
