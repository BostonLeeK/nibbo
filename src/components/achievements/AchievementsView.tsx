"use client";

import { useMemo } from "react";

type Achievement = {
  id: string;
  title: string;
  threshold: number;
};

type RankRow = {
  rank: number;
  familyId: string;
  familyName: string;
  points: number;
};

type FamilyInfo = {
  id: string;
  name: string;
  shareInLeaderboard: boolean;
} | null;

interface AchievementsViewProps {
  points: number;
  familyInfo: FamilyInfo;
  myRank: RankRow | null;
  rows: RankRow[];
  achievements: Achievement[];
}

export default function AchievementsView({
  points,
  familyInfo,
  myRank,
  rows,
  achievements,
}: AchievementsViewProps) {
  const nextAchievement = useMemo(
    () =>
      achievements.find((achievement) => points < achievement.threshold) ??
      null,
    [achievements, points],
  );
  const maxThreshold = achievements[achievements.length - 1]?.threshold ?? 1;
  const progressLimit = nextAchievement?.threshold ?? maxThreshold;
  const progress = Math.min(100, Math.round((points / progressLimit) * 100));

  return (
    <div className="relative max-w-5xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-lavender-200 bg-gradient-to-br from-lavender-50 via-rose-50 to-sky-50 p-5 md:p-6 shadow-sm">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-lavender-200/30 blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold text-warm-800">
            Ачівки
          </h1>
          <p className="text-sm text-warm-500 mt-1">
            Качай XP, відкривай досягнення і рухай сім’ю в топ рейтингу.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 border border-lavender-200">
              <span className="text-sm font-semibold text-warm-700">
                {points} XP
              </span>
            </div>
            {nextAchievement ? (
              <span className="text-xs md:text-sm text-warm-600">
                Далі: {nextAchievement.title} ({nextAchievement.threshold} XP)
              </span>
            ) : (
              <span className="text-xs md:text-sm text-sage-700">
                Усі досягнення відкрито
              </span>
            )}
          </div>
          <div className="mt-4 h-3 rounded-full bg-white/80 border border-warm-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lavender-400 via-rose-400 to-sky-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/85 rounded-3xl border border-warm-100 p-5 md:p-6">
        <h2 className="text-lg font-semibold text-warm-800">Досягнення</h2>
        <div className="grid gap-3 md:grid-cols-2 mt-4">
          {achievements.map((achievement) => {
            const unlocked = points >= achievement.threshold;
            return (
              <div
                key={achievement.id}
                className={`rounded-2xl border px-4 py-3 transition-all ${
                  unlocked
                    ? "bg-gradient-to-r from-sage-50 to-lavender-50 border-sage-200 shadow-sm"
                    : "bg-warm-50 border-warm-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-warm-800">
                    {achievement.title}
                  </p>
                  <span
                    className={`text-xs font-semibold ${unlocked ? "text-sage-700" : "text-warm-400"}`}
                  >
                    {unlocked ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>
                <p className="text-xs text-warm-500 mt-1">
                  Поріг: {achievement.threshold} XP
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/85 rounded-3xl border border-warm-100 p-5 md:p-6">
        <h2 className="text-lg font-semibold text-warm-800">
          Рейтинг родин (XP)
        </h2>
        <p className="text-xs text-warm-500 mt-1">
          У таблиці тільки родини, які ввімкнули видимість в рейтингу.
        </p>
        {familyInfo?.shareInLeaderboard && myRank ? (
          <p className="text-sm text-sage-700 mt-3">
            Ваша родина «{familyInfo.name}» на #{myRank.rank} місці з{" "}
            {myRank.points} XP.
          </p>
        ) : (
          <p className="text-sm text-warm-500 mt-3">
            Ваша родина не бере участь у рейтингу. Увімкніть опцію в розділі
            Родина.
          </p>
        )}
        <div className="mt-4 space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-warm-400">
              Поки немає родин у рейтингу.
            </p>
          ) : (
            rows.map((row) => (
              <div
                key={row.familyId}
                className={`flex items-center justify-between rounded-2xl px-4 py-2 border ${
                  row.familyId === familyInfo?.id
                    ? "bg-gradient-to-r from-lavender-50 to-rose-50 border-lavender-200"
                    : "bg-warm-50 border-warm-100"
                }`}
              >
                <p className="text-sm text-warm-800">
                  #{row.rank} {row.familyName}
                </p>
                <p className="text-sm font-semibold text-warm-700">
                  {row.points} XP
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
