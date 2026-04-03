"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import { Plus, Settings2 } from "lucide-react";
import {
  normalizeBoardsPayload,
  type TaskBoardBoard,
  type TaskBoardColumn,
  type TaskBoardTask,
  type TaskBoardUser,
} from "@/lib/task-board";
import {
  TASK_POINTS_AWARDED_EVENT,
} from "@/lib/task-points";
import TaskColumn from "./TaskColumn";
import TaskCard from "./TaskCard";
import AddBoardModal from "./AddBoardModal";
import TaskEditModal from "./TaskEditModal";

interface TaskBoardProps {
  initialBoards: TaskBoardBoard[];
  users: TaskBoardUser[];
  currentUserId: string;
}

type TaskPatchResponse = TaskBoardTask & { awardedPoints?: number };

async function fetchBoards(): Promise<TaskBoardBoard[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) return [];
  const data = await res.json();
  return normalizeBoardsPayload(data);
}

function mergeTaskIntoBoards(prev: TaskBoardBoard[], task: TaskBoardTask): TaskBoardBoard[] {
  if (task.completed) {
    return prev.map((b) => ({
      ...b,
      columns: b.columns.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== task.id),
      })),
    }));
  }
  return prev.map((b) => ({
    ...b,
    columns: b.columns.map((c) => {
      const rest = c.tasks.filter((t) => t.id !== task.id);
      if (c.id !== task.columnId) return { ...c, tasks: rest };
      const nextTasks = [...rest, task].sort((a, b) => a.order - b.order);
      return { ...c, tasks: nextTasks };
    }),
  }));
}

function SortableBoardTab({
  board,
  active,
  onSelect,
  onEditSettings,
}: {
  board: TaskBoardBoard;
  active: boolean;
  onSelect: () => void;
  onEditSettings: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: board.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center rounded-xl flex-shrink-0 border transition-all ${
        active
          ? "bg-white shadow-cozy text-warm-800 border-warm-100"
          : "border-transparent text-warm-500 hover:text-warm-700 hover:bg-white/50"
      }`}
    >
      <button
        type="button"
        className="px-1.5 py-2 text-warm-300 hover:text-warm-500 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Перетягнути дошку"
        {...attributes}
        {...listeners}
      >
        ⣿
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 px-2 py-2 text-sm font-medium whitespace-nowrap"
      >
        <span>{board.emoji}</span>
        <span>{board.name}</span>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEditSettings();
        }}
        className="p-2 text-warm-400 hover:text-rose-500 rounded-lg hover:bg-rose-50/80"
        aria-label="Налаштування дошки"
      >
        <Settings2 size={14} />
      </button>
    </div>
  );
}

export default function TaskBoard({ initialBoards, users, currentUserId }: TaskBoardProps) {
  const [boards, setBoards] = useState<TaskBoardBoard[]>(initialBoards);
  const [activeBoard, setActiveBoard] = useState(initialBoards[0]?.id ?? "");
  const [activeTask, setActiveTask] = useState<TaskBoardTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<TaskBoardColumn | null>(null);
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [editBoard, setEditBoard] = useState<TaskBoardBoard | null>(null);
  const [editTask, setEditTask] = useState<TaskBoardTask | null>(null);
  const prevActiveBoardRef = useRef<string | undefined>(undefined);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const currentBoard = boards.find((b) => b.id === activeBoard);

  const reloadBoards = useCallback(async () => {
    const next = await fetchBoards();
    setBoards(next);
    setActiveBoard((prev) => {
      if (next.some((b) => b.id === prev)) return prev;
      return next[0]?.id ?? "";
    });
  }, []);

  useEffect(() => {
    if (prevActiveBoardRef.current === undefined) {
      prevActiveBoardRef.current = activeBoard;
      return;
    }
    if (prevActiveBoardRef.current === activeBoard) return;
    prevActiveBoardRef.current = activeBoard;
    void reloadBoards();
  }, [activeBoard, reloadBoards]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (!currentBoard) return;
    if (boards.some((b) => b.id === id)) return;
    if (currentBoard.columns.some((c) => c.id === id)) {
      const col = currentBoard.columns.find((c) => c.id === id);
      if (col) setActiveColumn(col);
      return;
    }
    const task = currentBoard.columns.flatMap((c) => c.tasks).find((t) => t.id === id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (boards.some((b) => b.id === activeId)) {
      const oldIndex = boards.findIndex((b) => b.id === activeId);
      const newIndex = boards.findIndex((b) => b.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const next = arrayMove(boards, oldIndex, newIndex);
      setBoards(next);
      await fetch("/api/tasks/boards/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedBoardIds: next.map((b) => b.id) }),
      });
      return;
    }

    if (!currentBoard) return;

    if (currentBoard.columns.some((c) => c.id === activeId)) {
      const cols = currentBoard.columns;
      const oldIndex = cols.findIndex((c) => c.id === activeId);
      const overColumnId =
        cols.find((c) => c.id === overId)?.id ??
        cols.find((c) => c.tasks.some((t) => t.id === overId))?.id;
      if (!overColumnId) return;
      const newIndex = cols.findIndex((c) => c.id === overColumnId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const nextCols = arrayMove(cols, oldIndex, newIndex);
      setBoards((prev) =>
        prev.map((b) => (b.id === currentBoard.id ? { ...b, columns: nextCols } : b))
      );
      await fetch("/api/tasks/columns/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId: currentBoard.id,
          orderedColumnIds: nextCols.map((c) => c.id),
        }),
      });
      return;
    }

    const sourceColumn = currentBoard.columns.find((c) => c.tasks.some((t) => t.id === activeId));
    const targetColumn =
      currentBoard.columns.find((c) => c.tasks.some((t) => t.id === overId)) ||
      currentBoard.columns.find((c) => c.id === overId);

    if (!sourceColumn || !targetColumn) return;

    if (sourceColumn.id === targetColumn.id) {
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

  const addColumn = async (boardId: string, name: string, emoji: string, color: string) => {
    const board = boards.find((b) => b.id === boardId);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "column",
        name,
        emoji,
        color,
        boardId,
        order: board?.columns.length ?? 0,
      }),
    });
    const col = await res.json();
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, columns: [...b.columns, col] } : b))
    );
    toast.success("Колонку додано! 🎉");
  };

  const addTask = async (
    boardId: string,
    columnId: string,
    title: string,
    assigneeId?: string,
    priority: TaskBoardTask["priority"] = "MEDIUM"
  ) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "task",
        title,
        columnId,
        assigneeId,
        creatorId: currentUserId,
        priority,
      }),
    });
    const task = await res.json();
    setBoards((prev) =>
      prev.map((b) =>
        b.id === boardId
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

  const updateTaskAssignee = async (taskId: string, assigneeId: string | null) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!res.ok) throw new Error("fail");
      const task = await res.json();
      setBoards((prev) =>
        prev.map((b) => ({
          ...b,
          columns: b.columns.map((c) => ({
            ...c,
            tasks: c.tasks.map((t) => (t.id === taskId ? task : t)),
          })),
        }))
      );
    } catch {
      toast.error("Не вдалося оновити виконавця");
    }
  };

  const updateTaskPriority = async (taskId: string, priority: TaskBoardTask["priority"]) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (!res.ok) throw new Error("fail");
      const task = await res.json();
      setBoards((prev) =>
        prev.map((b) => ({
          ...b,
          columns: b.columns.map((c) => ({
            ...c,
            tasks: c.tasks.map((t) => (t.id === taskId ? task : t)),
          })),
        }))
      );
    } catch {
      toast.error("Не вдалося змінити пріоритет");
    }
  };

  const updateTaskCompleted = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error("fail");
      const task = (await res.json()) as TaskPatchResponse;
      setBoards((prev) => mergeTaskIntoBoards(prev, task));
      if (task.awardedPoints && task.awardedPoints > 0) {
        window.dispatchEvent(
          new CustomEvent(TASK_POINTS_AWARDED_EVENT, { detail: { points: task.awardedPoints } })
        );
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } bg-white border border-lavender-200 shadow-cozy rounded-2xl px-4 py-3`}
            >
              <p className="text-sm font-semibold text-warm-800">🎉 Вітаємо! +{task.awardedPoints} XP</p>
              <p className="text-xs text-warm-500 mt-1">Ще один крок до супер форми Nibbo</p>
            </div>
          ),
          { duration: 2200 }
        );
      }
    } catch {
      toast.error("Не вдалося оновити статус");
    }
  };

  const saveTaskFull = async (taskId: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error("fail");
    }
    const task = (await res.json()) as TaskPatchResponse;
    setBoards((prev) => mergeTaskIntoBoards(prev, task));
    if (task.awardedPoints && task.awardedPoints > 0) {
      window.dispatchEvent(
        new CustomEvent(TASK_POINTS_AWARDED_EVENT, { detail: { points: task.awardedPoints } })
      );
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } bg-white border border-lavender-200 shadow-cozy rounded-2xl px-4 py-3`}
          >
            <p className="text-sm font-semibold text-warm-800">🎉 Вітаємо! +{task.awardedPoints} XP</p>
            <p className="text-xs text-warm-500 mt-1">Nibbo радіє кожному завершенню задачі</p>
          </div>
        ),
        { duration: 2200 }
      );
    }
    toast.success("Збережено");
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

  const renameColumn = async (columnId: string, name: string) => {
    const res = await fetch(`/api/tasks/columns/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      toast.error("Не вдалося перейменувати");
      return;
    }
    const column = await res.json();
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.map((c) => (c.id === columnId ? { ...c, ...column } : c)),
      }))
    );
    toast.success("Колонку оновлено");
  };

  const deleteColumn = async (columnId: string) => {
    if (!confirm("Видалити колонку і всі задачі в ній?")) return;
    await fetch(`/api/tasks/columns/${columnId}`, { method: "DELETE" });
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        columns: b.columns.filter((c) => c.id !== columnId),
      }))
    );
    toast.success("Колонку видалено");
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

  const updateBoard = async (id: string, name: string, emoji: string, color: string) => {
    const res = await fetch(`/api/tasks/boards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, color }),
    });
    if (!res.ok) {
      toast.error("Не вдалося оновити дошку");
      return;
    }
    const board = await res.json();
    setBoards((prev) => prev.map((b) => (b.id === id ? board : b)));
    setEditBoard(null);
    toast.success("Дошку оновлено");
  };

  const deleteBoard = async (id: string) => {
    await fetch(`/api/tasks/boards/${id}`, { method: "DELETE" });
    setBoards((prev) => {
      const next = prev.filter((b) => b.id !== id);
      setActiveBoard((cur) => {
        if (cur !== id) return cur;
        return next[0]?.id ?? "";
      });
      return next;
    });
    setEditBoard(null);
    toast.success("Дошку видалено");
  };

  return (
    <div className="h-full flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <SortableContext items={boards.map((b) => b.id)} strategy={horizontalListSortingStrategy}>
            {boards.map((board) => (
              <SortableBoardTab
                key={board.id}
                board={board}
                active={activeBoard === board.id}
                onSelect={() => setActiveBoard(board.id)}
                onEditSettings={() => setEditBoard(board)}
              />
            ))}
          </SortableContext>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddBoard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-warm-400 hover:text-rose-500 hover:bg-rose-50 border-2 border-dashed border-warm-200 hover:border-rose-300 transition-all flex-shrink-0"
          >
            <Plus size={14} /> Нова дошка
          </motion.button>
        </div>

        {currentBoard ? (
          <>
            <div className="flex gap-4 overflow-x-auto pb-4 flex-1 scrollbar-hide">
              <SortableContext
                items={currentBoard.columns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {currentBoard.columns.map((column) => (
                  <TaskColumn
                    key={column.id}
                    column={column}
                    users={users}
                    onAddTask={(columnId, title, assigneeId, priority) =>
                      addTask(currentBoard.id, columnId, title, assigneeId, priority)
                    }
                    onDeleteTask={deleteTask}
                    onAssigneeChange={updateTaskAssignee}
                    onPriorityChange={updateTaskPriority}
                    onCompletedChange={(taskId, completed) => updateTaskCompleted(taskId, completed)}
                    onRenameColumn={renameColumn}
                    onDeleteColumn={deleteColumn}
                    onEditTask={setEditTask}
                  />
                ))}
              </SortableContext>
              <AddColumnButton
                onAdd={(name, emoji, color) => addColumn(currentBoard.id, name, emoji, color)}
              />
            </div>

            <DragOverlay>
              {activeTask && (
                <div className="rotate-2 opacity-90 w-72">
                  <TaskCard task={activeTask} users={users} isDragging />
                </div>
              )}
              {activeColumn && (
                <div className="w-72 opacity-90 rotate-1">
                  <div className="bg-white/90 rounded-3xl border border-rose-200 shadow-cozy p-4">
                    <span className="text-lg mr-2">{activeColumn.emoji}</span>
                    <span className="font-semibold text-warm-800">{activeColumn.name}</span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </>
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
      </DndContext>

      <AddBoardModal
        open={showAddBoard}
        onClose={() => setShowAddBoard(false)}
        onAdd={addBoard}
      />
      <AddBoardModal
        open={Boolean(editBoard)}
        onClose={() => setEditBoard(null)}
        editBoard={
          editBoard
            ? { id: editBoard.id, name: editBoard.name, emoji: editBoard.emoji, color: editBoard.color }
            : null
        }
        onUpdate={updateBoard}
        onDeleteBoard={deleteBoard}
      />
      <TaskEditModal
        open={Boolean(editTask)}
        task={editTask}
        users={users}
        onClose={() => setEditTask(null)}
        onSave={saveTaskFull}
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
              type="button"
              onClick={handleAdd}
              className="flex-1 bg-rose-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              Додати
            </button>
            <button
              type="button"
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
