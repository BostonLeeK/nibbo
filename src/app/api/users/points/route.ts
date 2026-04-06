import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { POINTS_PER_TASK_COMPLETION } from "@/lib/task-points";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const doneTotal = await prisma.task.count({
    where: {
      completed: true,
      column: { board: { familyId } },
    },
  });
  return NextResponse.json({ points: doneTotal * POINTS_PER_TASK_COMPLETION });
}
