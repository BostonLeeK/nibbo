"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import TaskColumn from "./TaskColumn";
import TaskCard from "./TaskCard";
import AddBoardModal from "./AddBoardModal";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  color: string;
  emoji: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  completed: boolean;
  order: number;
  columnId: string;
  assignee: User | null;
  creator: User;
  labels: string[];
}

interface Column {
  id: string;
  name: string;
  emoji: string;
  color: string;
  order: number;
  tasks: Task[];
}

interface Board {
  id: string;
  name: string;
  emoji: string;
  color: string;
  columns: Column[];
}

interface TaskBoardProps {
  initialBoards: Board[];
  users: User[];
  currentUserId: string;
}

export default function TaskBoard({ initialBoards, users, currentUserId }: TaskBoardProps) {
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [activeBoard, setActiveBoard] = useState(boards[0]?.id || "");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddBoard, setShowAddBoard] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const currentBoard = boards.find((b) => b.id === activeBoard);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = currentBoard?.columns
      .flatMap((c) => c.tasks)
      .find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !currentBoard) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumn = currentBoard.columns.find((c) => c.tasks.some((t) => t.id === activeId));
    const targetColumn =
      currentBoard.columns.find((c) => c.tasks.some((t) => t.id === overId)) ||
      currentBoard.columns.find((c) => c.id === overId);

    if (!sourceColumn || !targetColumn) return;

    if (sourceColumn.id === targetColumn.id) {
      // Reorder within column
      const oldIndex = sourceColumn.tasks.findIndex((t) => t.id === activeId);
      const newIndex = sourceColumn.tasks.findIndex((t) => t.id === overId);
      if (oldIndex === newIndex) return;

      const newTasks = arrayMove(sourceColumn.tasks, oldIndex, newIndex);

      setBoards((prev) =>
        prev.map((b) =>
          b.id === currentBoard.id
            ? {
                ...b,
                columns: b.columns.map((c) =>
                  c.id === sourceColumn.id ? { ...c, tasks: newTasks } : c
                ),
              }
            : b
        )
      );

      await fetch(`/api/tasks/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newIndex }),
      });
    } else {
      // Move to different column
      const task = sourceColumn.tasks.find((t) => t.id === activeId)!;
      const newSourceTasks = sourceColumn.tasks.filter((t) => t.id !== activeId);
      const newTargetTasks = [...targetColumn.tasks, { ...task, columnId: targetColumn.id }];

      setBoards((prev) =>
        prev.map((b) =>
          b.id === currentBoard.id
            ? {
                ...b,
                columns: b.columns.map((c) => {
                  if (c.id === sourceColumn.id) return { ...c, tasks: newSourceTasks };
                  if (c.id === targetColumn.id) return { ...c, tasks: newTargetTasks };
                  return c;
                }),
              }
            : b
        )
      );

      await fetch(`/api/tasks/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: targetColumn.id, order: newTargetTasks.length - 1 }),
      });
    }
  };

  const addColumn = async (name: string, emoji: string, color: string) => {
    if (!currentBoard) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "column",
        name,
        emoji,
        color,
        boardId: currentBoard.id,
        order: currentBoard.columns.length,
      }),
    });
    const col = await res.json();
    setBoards((prev) =>
      prev.map((b) =>
        b.id === currentBoard.id ? { ...b, columns: [...b.columns, col] } : b
      )
    );
    toast.success("Колонку додано! 🎉");
  };

  const addTask = async (columnId: string, title: string, assigneeId?: string) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "task",
        title,
        columnId,
        assigneeId,
        creatorId: currentUserId,
        priority: "MEDIUM",
      }),
    });
    const task = await res.json();
    setBoards((prev) =>
      prev.map((b) =>
        b.id === currentBoard?.id
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === columnId ? { ...c, tasks: [...c.tasks, task] } : c
              ),
            }
          : b
      )
    );
    toast.success("Задачу додано! ✅");
  };

  const deleteTask = async (taskId: string, columnId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((c) =>
          c.id === columnId ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) } : c
        ),
      }))
    );
    toast.success("Задачу видалено");
  };

  const addBoard = async (name: string, emoji: string, color: string) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "board", name, emoji, color }),
    });
    const board = await res.json();
    setBoards((prev) => [...prev, board]);
    setActiveBoard(board.id);
    setShowAddBoard(false);
    toast.success("Дошку створено! 🎊");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Board tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {boards.map((board) => (
          <motion.button
            key={board.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveBoard(board.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeBoard === board.id
                ? "bg-white shadow-cozy text-warm-800"
                : "text-warm-500 hover:text-warm-700 hover:bg-white/50"
            }`}
          >
            <span>{board.emoji}</span>
            <span>{board.name}</span>
          </motion.button>
        ))}
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddBoard(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-warm-400 hover:text-rose-500 hover:bg-rose-50 border-2 border-dashed border-warm-200 hover:border-rose-300 transition-all"
        >
          <Plus size={14} /> Нова дошка
        </motion.button>
      </div>

      {/* Columns */}
      {currentBoard ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1 scrollbar-hide">
            {currentBoard.columns.map((column) => (
              <TaskColumn
                key={column.id}
                column={column}
                users={users}
                onAddTask={addTask}
                onDeleteTask={deleteTask}
              />
            ))}

            {/* Add column */}
            <AddColumnButton onAdd={addColumn} />
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rotate-2 opacity-90">
                <TaskCard task={activeTask} users={users} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-warm-700 mb-2">Немає дошок</h3>
            <p className="text-warm-400 text-sm mb-4">Створіть першу дошку для задач</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddBoard(true)}
              className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-medium hover:bg-rose-600 transition-colors"
            >
              Створити дошку 🎉
            </motion.button>
          </div>
        </div>
      )}

      <AddBoardModal
        open={showAddBoard}
        onClose={() => setShowAddBoard(false)}
        onAdd={addBoard}
      />
    </div>
  );
}

function AddColumnButton({ onAdd }: { onAdd: (name: string, emoji: string, color: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name, "📝", "#e7e5e4");
    setName("");
    setIsAdding(false);
  };

  return (
    <div className="w-72 flex-shrink-0">
      {isAdding ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 rounded-3xl p-4 shadow-cozy border border-warm-100"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Назва колонки..."
            className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 placeholder:text-warm-400 outline-none border border-warm-200 focus:border-rose-300 mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-rose-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              Додати
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 bg-warm-100 text-warm-600 rounded-xl py-2 text-sm hover:bg-warm-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-sm text-warm-400 hover:text-rose-500 hover:bg-white/50 border-2 border-dashed border-warm-200 hover:border-rose-300 transition-all"
        >
          <Plus size={16} /> Нова колонка
        </motion.button>
      )}
    </div>
  );
}
