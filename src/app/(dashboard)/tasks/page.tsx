import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    }),
    prisma.user.findMany({
      select: { id: true, name: true, image: true, color: true, emoji: true },
    }),
  ]);

  const initialBoards = boards.map((board) => ({
    id: board.id,
    name: board.name,
    emoji: board.emoji,
    color: board.color,
    columns: board.columns.map((col) => ({
      id: col.id,
      name: col.name,
      emoji: col.emoji,
      color: col.color,
      order: col.order,
      tasks: col.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        completed: t.completed,
        order: t.order,
        columnId: t.columnId,
        assignee: t.assignee,
        creator: t.creator,
        labels: t.labels,
      })),
    })),
  }));

  return <TaskBoard initialBoards={initialBoards} users={users} currentUserId={session.user.id} />;
}
