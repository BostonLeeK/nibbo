"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Trash2, GripVertical } from "lucide-react";
import { cn, formatDate, PRIORITY_CONFIG } from "@/lib/utils";

interface User { id: string; name: string | null; image: string | null; color: string; emoji: string; }
interface Task {
  id: string; title: string; description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null; completed: boolean; order: number;
  columnId: string; assignee: User | null; creator: User; labels: string[];
}

interface TaskCardProps {
  task: Task;
  users: User[];
  onDelete?: () => void;
  isDragging?: boolean;
}

export default function TaskCard({ task, users, onDelete, isDragging }: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl p-3 shadow-sm border border-warm-100 cursor-pointer group",
        "hover:shadow-cozy hover:border-rose-100 transition-all",
        isDragging && "rotate-2 scale-105 shadow-cozy-hover"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 text-warm-300 hover:text-warm-500 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <GripVertical size={14} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Priority badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", priority.color)}>
              {priority.emoji} {priority.label}
            </span>
          </div>

          {/* Title */}
          <p className={cn(
            "text-sm font-medium text-warm-800 leading-snug mb-2",
            task.completed && "line-through text-warm-400"
          )}>
            {task.title}
          </p>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-warm-400 mb-2 line-clamp-2">{task.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-warm-400">
                  <Calendar size={11} />
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {task.assignee && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-medium ring-2 ring-white"
                  style={{ backgroundColor: task.assignee.color }}
                  title={task.assignee.name || ""}
                >
                  {task.assignee.emoji || task.assignee.name?.[0]}
                </div>
              )}

              {showActions && onDelete && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600 flex items-center justify-center transition-colors ml-1"
                >
                  <Trash2 size={11} />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
