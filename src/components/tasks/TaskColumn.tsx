"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Pencil, Trash2, GripHorizontal } from "lucide-react";
import { PRIORITY_CONFIG } from "@/lib/utils";
import TaskCard from "./TaskCard";
import type { TaskBoardColumn, TaskBoardTask, TaskBoardUser } from "@/lib/task-board";

const TASK_PRIORITIES: TaskBoardTask["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface TaskColumnProps {
  column: TaskBoardColumn;
  users: TaskBoardUser[];
  onAddTask: (
    columnId: string,
    title: string,
    assigneeId?: string,
    priority?: TaskBoardTask["priority"]
  ) => void;
  onDeleteTask: (taskId: string, columnId: string) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => void;
  onPriorityChange: (taskId: string, priority: TaskBoardTask["priority"]) => void;
  onCompletedChange: (taskId: string, completed: boolean) => void;
  onRenameColumn: (columnId: string, name: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onEditTask: (task: TaskBoardTask) => void;
}

export default function TaskColumn({
  column,
  users,
  onAddTask,
  onDeleteTask,
  onAssigneeChange,
  onPriorityChange,
  onCompletedChange,
  onRenameColumn,
  onDeleteColumn,
  onEditTask,
}: TaskColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newPriority, setNewPriority] = useState<TaskBoardTask["priority"]>("MEDIUM");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: column.id });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setSortableRef(node);
      setDroppableRef(node);
    },
    [setSortableRef, setDroppableRef]
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const handleAdd = () => {
    if (!newTaskTitle.trim()) return;
    onAddTask(column.id, newTaskTitle.trim(), newAssigneeId || undefined, newPriority);
    setNewTaskTitle("");
    setNewAssigneeId("");
    setNewPriority("MEDIUM");
    setIsAdding(false);
  };

  const closeAdd = () => {
    setIsAdding(false);
    setNewTaskTitle("");
    setNewAssigneeId("");
    setNewPriority("MEDIUM");
  };

  const startRename = () => {
    setRenameValue(column.name);
    setRenaming(true);
  };

  const commitRename = () => {
    if (renameValue.trim() && renameValue.trim() !== column.name) {
      void onRenameColumn(column.id, renameValue.trim());
    }
    setRenaming(false);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={`w-[calc(100vw-2.5rem)] sm:w-72 flex-shrink-0 snap-start bg-white/60 backdrop-blur-sm rounded-3xl border transition-[border-color,box-shadow,background-color] ${
        isOver ? "border-rose-300 shadow-cozy-hover bg-rose-50/50" : "border-warm-100 shadow-cozy"
      }`}
    >
      <div className="p-4 border-b border-warm-100">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <button
              type="button"
              className="p-1 text-warm-300 hover:text-warm-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
              aria-label="Перетягнути колонку"
              {...attributes}
              {...listeners}
            >
              <GripHorizontal size={16} />
            </button>
            {renaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="flex-1 min-w-0 bg-warm-50 rounded-lg px-2 py-1 text-sm font-semibold text-warm-800 border border-warm-200 outline-none focus:border-rose-300"
              />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg flex-shrink-0">{column.emoji}</span>
                <h3 className="font-semibold text-warm-800 text-sm truncate">{column.name}</h3>
                <span className="bg-warm-100 text-warm-500 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                  {column.tasks.length}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={startRename}
              className="w-7 h-7 rounded-lg bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center transition-colors"
              aria-label="Перейменувати"
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteColumn(column.id)}
              className="w-7 h-7 rounded-lg bg-warm-100 hover:bg-rose-100 text-warm-500 hover:text-rose-500 flex items-center justify-center transition-colors"
              aria-label="Видалити колонку"
            >
              <Trash2 size={12} />
            </button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAdding(true)}
              className="w-7 h-7 rounded-lg bg-warm-100 hover:bg-rose-100 text-warm-500 hover:text-rose-500 flex items-center justify-center transition-colors"
            >
              <Plus size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2 min-h-[100px] max-h-[60dvh] sm:max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              users={users}
              onDelete={() => onDeleteTask(task.id, column.id)}
              onAssigneeChange={(assigneeId) => onAssigneeChange(task.id, assigneeId)}
              onPriorityChange={(priority) => onPriorityChange(task.id, priority)}
              onCompletedChange={(completed) => onCompletedChange(task.id, completed)}
              onEdit={() => onEditTask(task)}
            />
          ))}
        </SortableContext>
      </div>

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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Назва задачі..."
            rows={2}
            className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 placeholder:text-warm-400 outline-none border border-warm-200 focus:border-rose-300 resize-none mb-2"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as TaskBoardTask["priority"])}
            className="w-full bg-warm-50 rounded-xl px-3 py-2 text-xs text-warm-800 border border-warm-200 focus:border-rose-300 outline-none mb-2"
          >
            {TASK_PRIORITIES.map((p) => {
              const c = PRIORITY_CONFIG[p];
              return (
                <option key={p} value={p}>
                  {c.emoji} {c.label}
                </option>
              );
            })}
          </select>
          {users.length > 0 && (
            <select
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              className="w-full bg-warm-50 rounded-xl px-3 py-2 text-xs text-warm-800 border border-warm-200 focus:border-rose-300 outline-none mb-2"
            >
              <option value="">Виконавець: не призначено</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.emoji} {u.name ?? "Користувач"}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 bg-rose-500 text-white rounded-xl py-2 text-xs font-medium hover:bg-rose-600 transition-colors"
            >
              Додати задачу
            </button>
            <button
              type="button"
              onClick={closeAdd}
              className="px-3 bg-warm-100 text-warm-600 rounded-xl py-2 text-xs hover:bg-warm-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
