import TaskTamagotchi3D from "@/components/shared/TaskTamagotchi3D";
import Link from "next/link";

const statePresets = [
  {
    key: "sleepy",
    title: "Sleepy",
    caption: "Немає руху по задачах",
    stats: { doneToday: 0, doneWeek: 0, myOpen: 9, doneTotal: 2 },
  },
  {
    key: "neutral",
    title: "Neutral",
    caption: "Початок прогресу",
    stats: { doneToday: 1, doneWeek: 4, myOpen: 7, doneTotal: 11 },
  },
  {
    key: "smile",
    title: "Smile",
    caption: "Стабільний темп",
    stats: { doneToday: 2, doneWeek: 9, myOpen: 4, doneTotal: 23 },
  },
  {
    key: "happy",
    title: "Happy",
    caption: "Максимальна форма",
    stats: { doneToday: 5, doneWeek: 18, myOpen: 1, doneTotal: 44 },
  },
];

export default function TamagotchiLabPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-warm-50/60 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-warm-800">Tamagotchi Lab</h1>
            <p className="text-sm text-warm-500 mt-1">Тестова сторінка для перегляду всіх станів</p>
            <p className="text-xs text-warm-400 mt-2">Файл моделі: public/models/water-sprite.glb</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-rose-600 hover:text-rose-700 bg-white border border-warm-200 rounded-xl px-3 py-2"
          >
            Повернутись у CRM
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {statePresets.map((preset) => (
            <section key={preset.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-warm-700">{preset.title}</h2>
                <span className="text-xs text-warm-400">{preset.caption}</span>
              </div>
              <TaskTamagotchi3D
                doneToday={preset.stats.doneToday}
                doneWeek={preset.stats.doneWeek}
                myOpen={preset.stats.myOpen}
                doneTotal={preset.stats.doneTotal}
              />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
