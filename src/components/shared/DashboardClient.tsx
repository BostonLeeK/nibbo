"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { formatDate, formatTime, PRIORITY_CONFIG } from "@/lib/utils";
import { useCozyConfig } from "@/hooks/useCozyConfig";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { TASK_POINTS_AWARDED_EVENT } from "@/lib/task-points";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { I18N } from "@/lib/i18n";

const TaskTamagotchi3D = dynamic(() => import("./TaskTamagotchi3D"), {
  ssr: false,
});

interface DashboardClientProps {
  stats: { taskCount: number; eventCount: number; shoppingCount: number };
  personalTaskStats: { myOpen: number; doneToday: number; doneWeek: number; doneTotal: number };
  upcomingEvents: any[];
  recentTasks: any[];
}

type DashboardTask = {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string | null;
  assignee?: { name?: string | null; color?: string; emoji?: string | null } | null;
};

type PersonalTaskStats = {
  myOpen: number;
  doneToday: number;
  doneWeek: number;
  doneTotal: number;
};

export default function DashboardClient({
  stats,
  personalTaskStats,
  upcomingEvents,
  recentTasks,
}: DashboardClientProps) {
  const { language } = useAppLanguage();
  const t = I18N[language].dashboard;
  const [show3D, setShow3D] = useState(false);
  const [tasks, setTasks] = useState<DashboardTask[]>(recentTasks as DashboardTask[]);
  const [tamagotchiStats, setTamagotchiStats] = useState<PersonalTaskStats>(personalTaskStats);
  const [confirmTask, setConfirmTask] = useState<DashboardTask | null>(null);
  const [busyComplete, setBusyComplete] = useState(false);
  const modelRef = useRef<HTMLDivElement | null>(null);
  const { motion: cozyMotion } = useCozyConfig();

  useEffect(() => {
    let timeoutId = 0;
    let idleId = 0;
    const trigger = () => setShow3D(true);
    if (typeof window !== "undefined") {
      timeoutId = window.setTimeout(trigger, 1200);
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(trigger, { timeout: 1200 });
      }
    }
    const node = modelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShow3D(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  const refreshTamagotchiStats = async () => {
    try {
      const res = await fetch("/api/dashboard/task-stats");
      if (!res.ok) return;
      const data = (await res.json()) as PersonalTaskStats;
      setTamagotchiStats(data);
    } catch {}
  };

  const completeTask = async () => {
    if (!confirmTask || busyComplete) return;
    setBusyComplete(true);
    try {
      const res = await fetch(`/api/tasks/${confirmTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!res.ok) throw new Error(t.completeTaskError);
      const data = (await res.json()) as { awardedPoints?: number };
      if (data.awardedPoints && data.awardedPoints > 0) {
        window.dispatchEvent(
          new CustomEvent(TASK_POINTS_AWARDED_EVENT, { detail: { points: data.awardedPoints } })
        );
      }
      setTasks((prev) => prev.filter((task) => task.id !== confirmTask.id));
      await refreshTamagotchiStats();
      toast.success(t.completeTaskSuccess);
      setConfirmTask(null);
    } catch {
      toast.error(t.completeTaskFailToast);
    } finally {
      setBusyComplete(false);
    }
  };

  const statCards = [
    { label: t.stats.activeTasks, value: stats.taskCount, emoji: "📋", color: "from-rose-400 to-rose-500", href: "/tasks" },
    { label: t.stats.upcomingEvents, value: stats.eventCount, emoji: "📅", color: "from-lavender-400 to-lavender-500", href: "/calendar" },
    { label: t.stats.toBuy, value: stats.shoppingCount, emoji: "🛒", color: "from-sage-400 to-sage-500", href: "/shopping" },
  ];

  const quickLinks = [
    { href: "/tasks", emoji: "📋", label: t.quickLinks.newTask, color: "bg-rose-50 hover:bg-rose-100 border-rose-200" },
    { href: "/calendar", emoji: "📅", label: t.quickLinks.newEvent, color: "bg-lavender-50 hover:bg-lavender-100 border-lavender-200" },
    { href: "/menu", emoji: "🍽️", label: t.quickLinks.planMenu, color: "bg-peach-50 hover:bg-peach-100 border-peach-200" },
    { href: "/notes", emoji: "📓", label: t.quickLinks.note, color: "bg-cream-50 hover:bg-cream-100 border-cream-200" },
    { href: "/budget", emoji: "💰", label: t.quickLinks.expense, color: "bg-sage-50 hover:bg-sage-100 border-sage-200" },
    { href: "/shopping", emoji: "🛒", label: t.quickLinks.addPurchase, color: "bg-sky-50 hover:bg-sky-100 border-sky-200" },
  ];

  return (
    <div className="space-y-5 md:space-y-6 max-w-6xl mx-auto">
      <div data-tour="dashboard-home">
        <h2 className="text-xl md:text-2xl font-bold text-warm-800">
          {t.dayFocusTitle}
        </h2>
        <p className="text-warm-500 text-sm mt-1">{t.dayFocusSubtitle}</p>
      </div>

      <div ref={modelRef} data-tour="tamagotchi-3d" className="min-h-[360px]">
        {show3D ? (
          <TaskTamagotchi3D
            doneToday={tamagotchiStats.doneToday}
            doneWeek={tamagotchiStats.doneWeek}
            myOpen={tamagotchiStats.myOpen}
            doneTotal={tamagotchiStats.doneTotal}
          />
        ) : (
          <div className="h-[360px] bg-white/75 rounded-3xl border border-warm-100 shadow-cozy animate-pulse" />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <motion.div
              whileHover={{ y: -2, scale: cozyMotion.hoverScale }}
              whileTap={{ scale: cozyMotion.tapScale }}
              transition={{ duration: cozyMotion.duration }}
              className={`bg-gradient-to-br ${card.color} rounded-3xl p-4 md:p-6 text-white shadow-cozy cursor-pointer`}
            >
              <div className="text-3xl md:text-4xl mb-2 md:mb-3">{card.emoji}</div>
              <div className="text-2xl md:text-3xl font-bold">{card.value}</div>
              <div className="text-sm opacity-90 mt-1">{card.label}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      <div>
        <h3 className="font-semibold text-warm-700 mb-3 text-sm">{t.quickAccess}</h3>
        <div data-tour="quick-actions" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} data-tour={link.href === "/menu" ? "recipes-action" : undefined}>
              <motion.div
                whileHover={{ y: -1, scale: cozyMotion.hoverScale }}
                whileTap={{ scale: cozyMotion.tapScale }}
                transition={{ duration: cozyMotion.duration }}
                className={`${link.color} border rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all`}
              >
                <span className="text-xl">{link.emoji}</span>
                <span className="text-sm font-medium text-warm-700">{link.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white/70 rounded-3xl p-4 md:p-5 shadow-cozy border border-warm-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-warm-800 flex items-center gap-2">
              <span>📅</span> {t.upcomingEventsTitle}
            </h3>
            <Link href="/calendar" className="text-xs text-rose-500 hover:text-rose-600 font-medium">
              {t.all}
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-warm-400">
                <div className="text-3xl mb-2">🌙</div>
                <p className="text-sm">{t.noEvents}</p>
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

        <div className="bg-white/70 rounded-3xl p-4 md:p-5 shadow-cozy border border-warm-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-warm-800 flex items-center gap-2">
              <span>📋</span> {t.activeTasksTitle}
            </h3>
            <Link href="/tasks" className="text-xs text-rose-500 hover:text-rose-600 font-medium">
              {t.all}
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-6 text-warm-400">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-sm">{t.allTasksDone}</p>
              </div>
            ) : (
              tasks.map((task) => {
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
                    <button
                      type="button"
                      onClick={() => setConfirmTask(task)}
                      className="w-7 h-7 rounded-full bg-sage-100 hover:bg-sage-200 text-sage-700 flex items-center justify-center transition-colors"
                      aria-label={t.markCompletedAria}
                    >
                      <Check size={14} />
                    </button>
                    {task.assignee && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0"
                        style={{ backgroundColor: task.assignee.color || "#f43f5e" }}
                        title={task.assignee.name ?? undefined}
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
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {confirmTask && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmTask(null)}
                  className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 14 }}
                  className="relative z-10 w-full max-w-md rounded-3xl bg-white shadow-cozy-lg border border-warm-100 p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-warm-800">{t.confirmTitle}</h3>
                      <p className="text-sm text-warm-500 mt-1">{t.confirmSubtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmTask(null)}
                      className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="rounded-2xl bg-warm-50 border border-warm-100 px-3 py-2.5 text-sm text-warm-700 mb-4">
                    {confirmTask.title}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmTask(null)}
                      className="flex-1 py-2.5 rounded-xl bg-white border border-warm-200 text-warm-700 text-sm font-medium"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      disabled={busyComplete}
                      onClick={completeTask}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sage-500 to-sage-400 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {busyComplete ? "..." : t.done}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
