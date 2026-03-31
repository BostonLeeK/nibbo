"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay, isToday,
  parseISO, addHours,
} from "date-fns";
import { uk } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface User { id: string; name: string | null; image: string | null; color: string; emoji: string; }
interface Event {
  id: string; title: string; description: string | null;
  emoji: string; color: string;
  startDate: string | Date; endDate: string | Date;
  allDay: boolean; location: string | null; assignee: User | null;
}

const EVENT_COLORS = [
  "#f43f5e", "#fb923c", "#facc15", "#4ade80",
  "#38bdf8", "#818cf8", "#c084fc", "#f472b6",
];

const EVENT_EMOJIS = ["📅", "🎉", "🏃", "💊", "🍽️", "✈️", "🎂", "🎓", "💼", "🌟"];

export default function CalendarView({ initialEvents, users, currentUserId }: {
  initialEvents: Event[];
  users: User[];
  currentUserId: string;
}) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "", description: "", emoji: "📅", color: "#8b5cf6",
    startDate: "", startTime: "10:00", endTime: "11:00",
    allDay: false, location: "", assigneeId: "",
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.startDate), day));

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startDate) return;

    const start = new Date(`${newEvent.startDate}T${newEvent.allDay ? "00:00" : newEvent.startTime}`);
    const end = new Date(`${newEvent.startDate}T${newEvent.allDay ? "23:59" : newEvent.endTime}`);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newEvent.title,
        description: newEvent.description,
        emoji: newEvent.emoji,
        color: newEvent.color,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        allDay: newEvent.allDay,
        location: newEvent.location,
        assigneeId: newEvent.assigneeId || undefined,
      }),
    });

    const event = await res.json();
    setEvents((prev) => [...prev, event]);
    setShowAddEvent(false);
    setNewEvent({ title: "", description: "", emoji: "📅", color: "#8b5cf6", startDate: "", startTime: "10:00", endTime: "11:00", allDay: false, location: "", assigneeId: "" });
    toast.success("Подію додано! 📅");
  };

  const handleDeleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Подію видалено");
  };

  const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  return (
    <div className="h-full flex gap-6">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-9 h-9 rounded-xl bg-white shadow-cozy flex items-center justify-center text-warm-500 hover:text-warm-800 transition-colors"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <h2 className="text-xl font-bold text-warm-800 capitalize min-w-48 text-center">
              {format(currentMonth, "LLLL yyyy", { locale: uk })}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-9 h-9 rounded-xl bg-white shadow-cozy flex items-center justify-center text-warm-500 hover:text-warm-800 transition-colors"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setNewEvent((p) => ({ ...p, startDate: format(new Date(), "yyyy-MM-dd") })); setShowAddEvent(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-lavender-500 to-lavender-400 text-white rounded-2xl text-sm font-medium shadow-cozy"
          >
            <Plus size={16} /> Нова подія
          </motion.button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-warm-400 py-2">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const todayDay = isToday(day);
            const inMonth = isSameMonth(day, currentMonth);

            return (
              <motion.div
                key={day.toISOString()}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "rounded-2xl p-1.5 cursor-pointer transition-all min-h-[70px]",
                  !inMonth && "opacity-30",
                  isSelected && "bg-lavender-50 ring-2 ring-lavender-400",
                  todayDay && !isSelected && "bg-rose-50 ring-2 ring-rose-300",
                  !isSelected && !todayDay && "hover:bg-warm-50"
                )}
              >
                <div className={cn(
                  "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  todayDay ? "bg-rose-500 text-white" : "text-warm-600"
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className="text-xs px-1.5 py-0.5 rounded-md text-white truncate"
                      style={{ backgroundColor: e.color }}
                    >
                      {e.emoji} {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-warm-400 px-1">+{dayEvents.length - 2}</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-72 flex flex-col gap-4">
        {selectedDay ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 rounded-3xl shadow-cozy border border-warm-100 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-warm-800">
                {format(selectedDay, "d MMMM", { locale: uk })}
              </h3>
              <button
                onClick={() => { setNewEvent((p) => ({ ...p, startDate: format(selectedDay, "yyyy-MM-dd") })); setShowAddEvent(true); }}
                className="w-7 h-7 rounded-xl bg-lavender-100 hover:bg-lavender-200 text-lavender-600 flex items-center justify-center transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-warm-400">
                <div className="text-3xl mb-2">🌙</div>
                <p className="text-sm">Нічого не заплановано</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-2xl border"
                    style={{ borderColor: event.color + "40", backgroundColor: event.color + "10" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-warm-800 text-sm">
                          {event.emoji} {event.title}
                        </p>
                        {!event.allDay && (
                          <p className="text-xs text-warm-500 mt-1">
                            {formatTime(event.startDate)} — {formatTime(event.endDate)}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-xs text-warm-400 mt-1">📍 {event.location}</p>
                        )}
                        {event.assignee && (
                          <div className="flex items-center gap-1 mt-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                              style={{ backgroundColor: event.assignee.color }}
                            >
                              {event.assignee.emoji || event.assignee.name?.[0]}
                            </div>
                            <span className="text-xs text-warm-500">{event.assignee.name}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-warm-300 hover:text-rose-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-white/60 rounded-3xl p-5 text-center text-warm-400 border border-warm-100">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-sm">Вибери день щоб побачити події</p>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddEvent(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md m-4"
            >
              <div className="bg-white rounded-3xl shadow-cozy-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-warm-800">Нова подія 📅</h2>
                  <button onClick={() => setShowAddEvent(false)} className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Emoji & Color row */}
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-warm-50 border border-warm-200 flex items-center justify-center text-2xl cursor-pointer hover:bg-warm-100 transition-colors">
                      {newEvent.emoji}
                    </div>
                    <div className="flex gap-1 items-center flex-wrap">
                      {EVENT_EMOJIS.slice(0, 5).map((e) => (
                        <button key={e} onClick={() => setNewEvent((p) => ({ ...p, emoji: e }))}
                          className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newEvent.emoji === e ? "bg-lavender-100 ring-2 ring-lavender-400" : "hover:bg-warm-50"}`}>
                          {e}
                        </button>
                      ))}
                      {EVENT_COLORS.map((c) => (
                        <button key={c} onClick={() => setNewEvent((p) => ({ ...p, color: c }))}
                          className={`w-6 h-6 rounded-full transition-all ${newEvent.color === c ? "ring-2 ring-offset-1 ring-warm-400 scale-110" : "hover:scale-105"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>

                  <input value={newEvent.title} onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Назва події" className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-lavender-400" />

                  <input value={newEvent.description} onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Опис (необов'язково)" className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-lavender-400" />

                  <input type="date" value={newEvent.startDate} onChange={(e) => setNewEvent((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-lavender-400" />

                  {!newEvent.allDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <input type="time" value={newEvent.startTime} onChange={(e) => setNewEvent((p) => ({ ...p, startTime: e.target.value }))}
                        className="bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-lavender-400" />
                      <input type="time" value={newEvent.endTime} onChange={(e) => setNewEvent((p) => ({ ...p, endTime: e.target.value }))}
                        className="bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-lavender-400" />
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newEvent.allDay} onChange={(e) => setNewEvent((p) => ({ ...p, allDay: e.target.checked }))}
                      className="rounded accent-lavender-500" />
                    <span className="text-sm text-warm-600">Весь день</span>
                  </label>

                  <input value={newEvent.location} onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))}
                    placeholder={"📍 Місце (необов'язково)"} className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-lavender-400" />

                  <select value={newEvent.assigneeId} onChange={(e) => setNewEvent((p) => ({ ...p, assigneeId: e.target.value }))}
                    className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-lavender-400">
                    <option value="">{"👤 Відповідальний (необов'язково)"}</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.emoji} {u.name}</option>)}
                  </select>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleAddEvent}
                    className="w-full py-3 bg-gradient-to-r from-lavender-500 to-lavender-400 text-white rounded-2xl font-semibold hover:shadow-cozy transition-all">
                    Додати подію {newEvent.emoji}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
