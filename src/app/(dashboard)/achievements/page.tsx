import AchievementsView from "@/components/achievements/AchievementsView";
import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { FAMILY_ACHIEVEMENT_THRESHOLDS, familyXpFromCompletedTaskCount } from "@/lib/family-achievements";
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

const achievements = FAMILY_ACHIEVEMENT_THRESHOLDS.map((a) => ({
  id: a.id,
  threshold: a.threshold,
  title: "",
}));

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const familyId = await ensureUserFamily(userId);
  if (!familyId) redirect("/login");

  const [familyCompletedTasks, familyInfoRows, leaderboard] = await Promise.all([
    prisma.task.count({
      where: {
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
  const points = familyXpFromCompletedTaskCount(familyCompletedTasks);
  const rows = leaderboard.map((row, index) => ({
    rank: index + 1,
    familyId: row.familyId,
    familyName: row.familyName,
    points: familyXpFromCompletedTaskCount(row.completedTasks),
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
