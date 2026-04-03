import AchievementsView from "@/components/achievements/AchievementsView";
import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { POINTS_PER_TASK_COMPLETION } from "@/lib/task-points";
import { redirect } from "next/navigation";

type LeaderboardRow = {
  familyId: string;
  familyName: string;
  completedTasks: number;
};

type FamilyInfoRow = {
  id: string;
  name: string;
  shareInLeaderboard: boolean;
};

const achievements = [
  { id: "first-steps", title: "Перші кроки", threshold: 50 },
  { id: "warm-routine", title: "Тепла рутина", threshold: 150 },
  { id: "cozy-family", title: "Cozy Family", threshold: 300 },
  { id: "task-masters", title: "Task Masters", threshold: 600 },
  { id: "legend", title: "Nibbo Legend", threshold: 1000 },
];

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const familyId = await ensureUserFamily(userId);
  if (!familyId) redirect("/login");

  const [userCompletedTasks, familyInfoRows, leaderboard] = await Promise.all([
    prisma.task.count({
      where: {
        OR: [{ assigneeId: userId }, { creatorId: userId }],
        completed: true,
        column: { board: { familyId } },
      },
    }),
    prisma.$queryRaw<FamilyInfoRow[]>`
      SELECT "id", "name", "shareInLeaderboard"
      FROM "Family"
      WHERE "id" = ${familyId}
      LIMIT 1
    `,
    prisma.$queryRaw<LeaderboardRow[]>`
      SELECT
        f."id" AS "familyId",
        f."name" AS "familyName",
        COUNT(t."id")::int AS "completedTasks"
      FROM "Family" f
      LEFT JOIN "TaskBoard" b ON b."familyId" = f."id"
      LEFT JOIN "TaskColumn" c ON c."boardId" = b."id"
      LEFT JOIN "Task" t ON t."columnId" = c."id" AND t."completed" = true
      WHERE f."shareInLeaderboard" = true
      GROUP BY f."id", f."name"
      ORDER BY COUNT(t."id") DESC, f."name" ASC
    `,
  ]);

  const familyInfo = familyInfoRows[0] ?? null;
  const points = userCompletedTasks * POINTS_PER_TASK_COMPLETION;
  const rows = leaderboard.map((row, index) => ({
    rank: index + 1,
    familyId: row.familyId,
    familyName: row.familyName,
    points: row.completedTasks * POINTS_PER_TASK_COMPLETION,
  }));
  const myRank = rows.find((row) => row.familyId === familyId) ?? null;

  return (
    <AchievementsView
      points={points}
      familyInfo={familyInfo}
      myRank={myRank}
      rows={rows}
      achievements={achievements}
    />
  );
}
