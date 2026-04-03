import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import { dashboardHeaderLabels } from "@/lib/utils";
import { POINTS_PER_TASK_COMPLETION } from "@/lib/task-points";
import { ensureUserFamily } from "@/lib/family";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, color: true, emoji: true },
  });
  if (!user) redirect("/login");

  const userId = session.user.id;
  const familyId = await ensureUserFamily(userId);
  if (!familyId) redirect("/login");
  const mine = { OR: [{ assigneeId: userId }, { creatorId: userId }] };
  const doneTotal = await prisma.task.count({
    where: { ...mine, completed: true, column: { board: { familyId } } },
  });
  const points = doneTotal * POINTS_PER_TASK_COMPLETION;

  const { greeting, dateLabel } = dashboardHeaderLabels();

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col md:overflow-hidden">
        <Header user={user} greeting={greeting} dateLabel={dateLabel} initialPoints={points} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
