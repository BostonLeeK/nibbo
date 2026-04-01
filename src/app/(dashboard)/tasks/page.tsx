import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeBoardsPayload } from "@/lib/task-board";
import TaskBoard from "@/components/tasks/TaskBoard";

export default async function TasksPage() {
  const session = await auth();
  if (!session) return null;

  const [boards, users] = await Promise.all([
    prisma.taskBoard.findMany({
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
      select: { id: true, name: true, image: true, color: true, emoji: true },
    }),
  ]);

  const initialBoards = normalizeBoardsPayload(boards);

  return <TaskBoard initialBoards={initialBoards} users={users} currentUserId={session.user.id} />;
}
