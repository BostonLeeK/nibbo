"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { PRIORITY_CONFIG } from "@/lib/utils";
import type { TaskBoardTask, TaskBoardUser } from "@/lib/task-board";

const PRIOS: TaskBoardTask["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface TaskEditModalProps {
  open: boolean;
  task: TaskBoardTask | null;
  users: TaskBoardUser[];
  onClose: () => void;
  onSave: (taskId: string, payload: Record<string, unknown>) => Promise<void>;
}

export default function TaskEditModal({ open, task, users, onClose, onSave }: TaskEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [completed, setCompleted] = useState(false);
  const [priority, setPriority] = useState<TaskBoardTask["priority"]>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setCompleted(task.completed);
    setPriority(task.priority);
    setAssigneeId(task.assignee?.id ?? "");
  }, [task]);

  const handleSave = async () => {
    if (!task?.id || !title.trim()) return;
    setSaving(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        completed,
        priority,
        assigneeId: assigneeId || null,
      });
      onClose();
    } catch {
      toast.error("Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  if (!task || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-white rounded-3xl shadow-cozy-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-warm-800">Редагувати задачу</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Назва"
                  className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 border border-warm-200 focus:border-rose-300 outline-none"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опис"
                  rows={3}
                  className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 border border-warm-200 focus:border-rose-300 outline-none resize-none"
                />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 border border-warm-200 focus:border-rose-300 outline-none"
                />
                <label className="flex items-center gap-2 text-sm text-warm-700">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(e) => setCompleted(e.target.checked)}
                    className="rounded border-warm-300"
                  />
                  Виконано
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskBoardTask["priority"])}
                  className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 border border-warm-200 outline-none"
                >
                  {PRIOS.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_CONFIG[p].emoji} {PRIORITY_CONFIG[p].label}
                    </option>
                  ))}
                </select>
                {users.length > 0 && (
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 border border-warm-200 outline-none"
                  >
                    <option value="">Без виконавця</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.emoji} {u.name ?? "Користувач"}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 disabled:opacity-50"
                  >
                    Зберегти
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-warm-100 text-warm-600 rounded-xl text-sm"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
