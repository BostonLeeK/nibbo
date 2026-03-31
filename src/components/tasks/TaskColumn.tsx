"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

interface User { id: string; name: string | null; image: string | null; color: string; emoji: string; }
interface Task {
  id: string; title: string; description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null; completed: boolean; order: number;
  columnId: string; assignee: User | null; creator: User; labels: string[];
}
interface Column { id: string; name: string; emoji: string; color: string; order: number; tasks: Task[]; }

interface TaskColumnProps {
  column: Column;
  users: User[];
  onAddTask: (columnId: string, title: string, assigneeId?: string) => void;
  onDeleteTask: (taskId: string, columnId: string) => void;
}

export default function TaskColumn({ column, users, onAddTask, onDeleteTask }: TaskColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(column.id, newTaskTitle);
    setNewTaskTitle("");
    setIsAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-72 flex-shrink-0 bg-white/60 backdrop-blur-sm rounded-3xl border transition-all ${
        isOver ? "border-rose-300 shadow-cozy-hover bg-rose-50/50" : "border-warm-100 shadow-cozy"
      }`}
    >
      {/* Column header */}
      <div className="p-4 border-b border-warm-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{column.emoji}</span>
            <h3 className="font-semibold text-warm-800 text-sm">{column.name}</h3>
            <span className="bg-warm-100 text-warm-500 text-xs font-medium px-2 py-0.5 rounded-full">
              {column.tasks.length}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAdding(true)}
            className="w-6 h-6 rounded-lg bg-warm-100 hover:bg-rose-100 text-warm-500 hover:text-rose-500 flex items-center justify-center transition-colors"
          >
            <Plus size={14} />
          </motion.button>
        </div>
      </div>

      {/* Tasks */}
      <div ref={setNodeRef} className="p-3 space-y-2 min-h-[100px] max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              users={users}
              onDelete={() => onDeleteTask(task.id, column.id)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add task input */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-3 border-t border-warm-100"
        >
          <textarea
            autoFocus
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
            placeholder="Назва задачі..."
            rows={2}
            className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 placeholder:text-warm-400 outline-none border border-warm-200 focus:border-rose-300 resize-none mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-rose-500 text-white rounded-xl py-2 text-xs font-medium hover:bg-rose-600 transition-colors"
            >
              Додати задачу
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 bg-warm-100 text-warm-600 rounded-xl py-2 text-xs hover:bg-warm-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
