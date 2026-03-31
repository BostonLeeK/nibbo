import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CalendarView from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) return null;

  const [events, users] = await Promise.all([
    prisma.event.findMany({
      include: { assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, image: true, color: true, emoji: true } }),
  ]);

  return <CalendarView initialEvents={events} users={users} currentUserId={session.user.id} />;
}
