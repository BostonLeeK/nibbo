"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import TaskTamagotchi3D from "@/components/shared/TaskTamagotchi3D";
import { unlockedFamilyAchievementIds } from "@/lib/family-achievements";

const LAB_DEFAULT_FAMILY_ID = "c9a63100-0000-4000-8000-000000000000";

const PRESETS = [
  {
    key: "sleepy",
    title: "Sleepy",
    caption: "Немає руху по задачах",
    stats: { doneToday: 0, doneWeek: 0, myOpen: 9, doneTotal: 2 },
    familyXp: 20,
  },
  {
    key: "neutral",
    title: "Neutral",
    caption: "Початок прогресу",
    stats: { doneToday: 1, doneWeek: 4, myOpen: 7, doneTotal: 11 },
    familyXp: 120,
  },
  {
    key: "smile",
    title: "Smile",
    caption: "Стабільний темп",
    stats: { doneToday: 2, doneWeek: 9, myOpen: 4, doneTotal: 23 },
    familyXp: 720,
  },
  {
    key: "happy",
    title: "Happy",
    caption: "Максимальна форма",
    stats: { doneToday: 5, doneWeek: 18, myOpen: 1, doneTotal: 44 },
    familyXp: 3200,
  },
] as const;

export default function TamagotchiLabClient() {
  const [familyId, setFamilyId] = useState(LAB_DEFAULT_FAMILY_ID);

  const randomize = useCallback(() => {
    setFamilyId(crypto.randomUUID());
  }, []);

  const resetDefault = useCallback(() => {
    setFamilyId(LAB_DEFAULT_FAMILY_ID);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-warm-50/60 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-warm-800">Nibbo Lab</h1>
              <p className="text-sm text-warm-500 mt-1">Тестова сторінка для перегляду всіх станів Nibbo</p>
              <p className="text-xs text-warm-400 mt-2">
                Один UUID сім&apos;ї на всі чотири картки — та сама форма, різні стани задач.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/dashboard"
                className="text-sm text-rose-600 hover:text-rose-700 bg-white border border-warm-200 rounded-xl px-3 py-2"
              >
                У CRM
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 rounded-2xl border border-warm-200 bg-white/80 p-3 shadow-sm">
            <label className="text-xs font-medium text-warm-600 shrink-0">UUID сім&apos;ї</label>
            <input
              type="text"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              spellCheck={false}
              className="min-w-0 flex-1 sm:min-w-[320px] text-[11px] font-mono text-warm-800 bg-warm-50 border border-warm-200 rounded-lg px-2 py-2 outline-none focus:border-sage-400"
              aria-label="Family UUID for all four mood cards"
            />
            <button
              type="button"
              onClick={randomize}
              className="text-sm font-medium text-white bg-sage-600 hover:bg-sage-700 rounded-xl px-3 py-2 shadow-sm"
            >
              Випадковий UUID
            </button>
            <button
              type="button"
              onClick={resetDefault}
              className="text-sm text-warm-600 hover:text-warm-800 bg-white border border-warm-200 rounded-xl px-3 py-2"
            >
              Дефолт лабу
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {PRESETS.map((preset) => (
            <section key={preset.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-warm-700">{preset.title}</h2>
                <span className="text-xs text-warm-400">{preset.caption}</span>
              </div>
              <TaskTamagotchi3D
                familyId={familyId.trim() || LAB_DEFAULT_FAMILY_ID}
                doneToday={preset.stats.doneToday}
                doneWeek={preset.stats.doneWeek}
                myOpen={preset.stats.myOpen}
                doneTotal={preset.stats.doneTotal}
                familyXp={preset.familyXp}
                unlockedAchievementIds={unlockedFamilyAchievementIds(preset.familyXp)}
              />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
