"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { formatDate, formatTime, PRIORITY_CONFIG } from "@/lib/utils";
import TaskTamagotchi3D from "./TaskTamagotchi3D";

interface DashboardClientProps {
  stats: { taskCount: number; eventCount: number; shoppingCount: number };
  personalTaskStats: { myOpen: number; doneToday: number; doneWeek: number; doneTotal: number };
  upcomingEvents: any[];
  recentTasks: any[];
  userName: string;
}

export default function DashboardClient({
  stats,
  personalTaskStats,
  upcomingEvents,
  recentTasks,
  userName,
}: DashboardClientProps) {
  const statCards = [
    { label: "Активних задач", value: stats.taskCount, emoji: "📋", color: "from-rose-400 to-rose-500", href: "/tasks" },
    { label: "Майбутніх подій", value: stats.eventCount, emoji: "📅", color: "from-lavender-400 to-lavender-500", href: "/calendar" },
    { label: "До купівлі", value: stats.shoppingCount, emoji: "🛒", color: "from-sage-400 to-sage-500", href: "/shopping" },
  ];

  const quickLinks = [
    { href: "/tasks", emoji: "📋", label: "Нова задача", color: "bg-rose-50 hover:bg-rose-100 border-rose-200" },
    { href: "/calendar", emoji: "📅", label: "Новий івент", color: "bg-lavender-50 hover:bg-lavender-100 border-lavender-200" },
    { href: "/menu", emoji: "🍽️", label: "Планувати меню", color: "bg-peach-50 hover:bg-peach-100 border-peach-200" },
    { href: "/notes", emoji: "📓", label: "Нотатка", color: "bg-cream-50 hover:bg-cream-100 border-cream-200" },
    { href: "/budget", emoji: "💰", label: "Витрата", color: "bg-sage-50 hover:bg-sage-100 border-sage-200" },
    { href: "/shopping", emoji: "🛒", label: "Додати покупку", color: "bg-sky-50 hover:bg-sky-100 border-sky-200" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-warm-800">
          Що нового, <span className="text-rose-500">{userName.split(" ")[0]}</span>? 🌸
        </h2>
        <p className="text-warm-500 text-sm mt-1">Твій родинний простір готовий до роботи</p>
      </div>

      <TaskTamagotchi3D
        doneToday={personalTaskStats.doneToday}
        doneWeek={personalTaskStats.doneWeek}
        myOpen={personalTaskStats.myOpen}
        doneTotal={personalTaskStats.doneTotal}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`bg-gradient-to-br ${card.color} rounded-3xl p-6 text-white shadow-cozy cursor-pointer`}
            >
              <div className="text-4xl mb-3">{card.emoji}</div>
              <div className="text-3xl font-bold">{card.value}</div>
              <div className="text-sm opacity-90 mt-1">{card.label}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h3 className="font-semibold text-warm-700 mb-3 text-sm">Швидкий доступ ✨</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`${link.color} border rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all`}
              >
                <span className="text-xl">{link.emoji}</span>
                <span className="text-sm font-medium text-warm-700">{link.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <div className="bg-white/70 rounded-3xl p-5 shadow-cozy border border-warm-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-warm-800 flex items-center gap-2">
              <span>📅</span> Майбутні події
            </h3>
            <Link href="/calendar" className="text-xs text-rose-500 hover:text-rose-600 font-medium">
              Всі →
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-warm-400">
                <div className="text-3xl mb-2">🌙</div>
                <p className="text-sm">Поки немає подій</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 p-3 rounded-2xl hover:bg-warm-50 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-warm-800 text-sm truncate">{event.emoji} {event.title}</p>
                    <p className="text-xs text-warm-400">
                      {formatDate(event.startDate)} {!event.allDay && `• ${formatTime(event.startDate)}`}
                    </p>
                  </div>
                  {event.assignee && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                      style={{ backgroundColor: event.assignee.color || "#f43f5e" }}
                      title={event.assignee.name}
                    >
                      {event.assignee.emoji || event.assignee.name?.[0]}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Recent tasks */}
        <div className="bg-white/70 rounded-3xl p-5 shadow-cozy border border-warm-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-warm-800 flex items-center gap-2">
              <span>📋</span> Твої активні задачі
            </h3>
            <Link href="/tasks" className="text-xs text-rose-500 hover:text-rose-600 font-medium">
              Всі →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <div className="text-center py-6 text-warm-400">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-sm">Всі задачі виконані!</p>
              </div>
            ) : (
              recentTasks.map((task) => {
                const priority =
                  PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ??
                  PRIORITY_CONFIG.MEDIUM;
                return (
                  <motion.div
                    key={task.id}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-warm-50 transition-colors"
                  >
                    <span className="text-sm">{priority.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-warm-800 text-sm truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-warm-400">{formatDate(task.dueDate)}</p>
                      )}
                    </div>
                    {task.assignee && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: task.assignee.color || "#f43f5e" }}
                        title={task.assignee.name}
                      >
                        {task.assignee.emoji || task.assignee.name?.[0]}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
