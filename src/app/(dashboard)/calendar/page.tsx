import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import CalendarView from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) return null;
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return null;

  const [events, users] = await Promise.all([
    prisma.event.findMany({
      where: { familyId },
      include: { assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.user.findMany({ where: { familyId }, select: { id: true, name: true, image: true, color: true, emoji: true } }),
  ]);

  return (
    <div className="h-full">
      <CalendarView initialEvents={events} users={users} currentUserId={session.user.id} />
    </div>
  );
}
