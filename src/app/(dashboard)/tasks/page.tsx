import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { normalizeBoardsPayload } from "@/lib/task-board";
import TaskBoardClient from "@/components/tasks/TaskBoardClient";

export default async function TasksPage() {
  const session = await auth();
  if (!session) return null;
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return null;

  const [boards, users] = await Promise.all([
    prisma.taskBoard.findMany({
      where: { familyId },
      include: {
        columns: {
          include: {
            tasks: {
              where: { completed: false },
              include: {
                assignee: { select: { id: true, name: true, image: true, color: true, emoji: true } },
                creator: { select: { id: true, name: true, image: true, color: true, emoji: true } },
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.user.findMany({
      where: { familyId },
      select: { id: true, name: true, image: true, color: true, emoji: true },
    }),
  ]);

  const initialBoards = normalizeBoardsPayload(boards);

  return <TaskBoardClient initialBoards={initialBoards} users={users} currentUserId={session.user.id} />;
}
