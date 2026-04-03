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

  const [userCompletedTasks, familyInfo, leaderboard] = await Promise.all([
    prisma.task.count({
      where: {
        OR: [{ assigneeId: userId }, { creatorId: userId }],
        completed: true,
        column: { board: { familyId } },
      },
    }),
    prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true, name: true, shareInLeaderboard: true },
    }),
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

  const points = userCompletedTasks * POINTS_PER_TASK_COMPLETION;
  const rows = leaderboard.map((row, index) => ({
    rank: index + 1,
    familyId: row.familyId,
    familyName: row.familyName,
    points: row.completedTasks * POINTS_PER_TASK_COMPLETION,
  }));
  const myRank = rows.find((row) => row.familyId === familyId) ?? null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5 md:p-6">
        <h1 className="text-2xl font-bold text-warm-800">Ачівки</h1>
        <p className="text-sm text-warm-500 mt-1">Твій прогрес і рейтинг родини серед інших родин Nibbo.</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-lavender-100 to-rose-100 border border-lavender-200">
          <span className="text-sm font-semibold text-warm-700">{points} XP</span>
        </div>
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5 md:p-6">
        <h2 className="text-lg font-semibold text-warm-800">Досягнення</h2>
        <div className="grid gap-3 md:grid-cols-2 mt-4">
          {achievements.map((achievement) => {
            const unlocked = points >= achievement.threshold;
            return (
              <div
                key={achievement.id}
                className={`rounded-2xl border px-4 py-3 ${unlocked ? "bg-sage-50 border-sage-200" : "bg-warm-50 border-warm-200"}`}
              >
                <p className="text-sm font-semibold text-warm-800">{achievement.title}</p>
                <p className="text-xs text-warm-500 mt-1">Потрібно: {achievement.threshold} XP</p>
                <p className={`text-xs font-semibold mt-2 ${unlocked ? "text-sage-700" : "text-warm-400"}`}>
                  {unlocked ? "Відкрито" : "Ще не відкрито"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5 md:p-6">
        <h2 className="text-lg font-semibold text-warm-800">Рейтинг родин (XP)</h2>
        <p className="text-xs text-warm-500 mt-1">Показані тільки родини, які увімкнули видимість у рейтингу.</p>
        {familyInfo?.shareInLeaderboard && myRank ? (
          <p className="text-sm text-sage-700 mt-3">
            Ваша родина «{familyInfo.name}» зараз на #{myRank.rank} місці з {myRank.points} XP.
          </p>
        ) : (
          <p className="text-sm text-warm-500 mt-3">
            Ваша родина зараз не бере участь у рейтингу. Увімкніть опцію у розділі Родина, щоб зʼявитися у списку.
          </p>
        )}
        <div className="mt-4 space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-warm-400">Поки немає родин у рейтингу.</p>
          ) : (
            rows.map((row) => (
              <div key={row.familyId} className="flex items-center justify-between rounded-2xl bg-warm-50 border border-warm-100 px-4 py-2">
                <p className="text-sm text-warm-800">
                  #{row.rank} {row.familyName}
                </p>
                <p className="text-sm font-semibold text-warm-700">{row.points} XP</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
