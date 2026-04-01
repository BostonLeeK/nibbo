"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pin, Trash2, X, Search, Save, FolderPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface User { id: string; name: string | null; image: string | null; color: string; emoji: string; }
interface NoteCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  parentId: string | null;
}
interface Note {
  id: string; title: string; content: string; emoji: string;
  color: string; pinned: boolean; author: User; tags: string[]; updatedAt: string;
  categoryId: string | null;
  category: NoteCategory | null;
}

const NOTE_COLORS = [
  "#faf3e0", "#fff1f4", "#f5f3ff", "#f0fdf4", "#f0f9ff", "#fff7ed", "#fdf2f8",
];
const NOTE_EMOJIS = ["📓", "💭", "🌟", "💡", "🎯", "📝", "💌", "🌸", "✨", "🍀"];
const CATEGORY_EMOJIS = ["📂", "📁", "🧠", "🏠", "💼", "💡", "🎯", "🗂️"];
const CATEGORY_COLORS = ["#f5f3ff", "#fff1f4", "#f0f9ff", "#f0fdf4", "#fff7ed", "#faf3e0"];

export default function NotesView({
  initialNotes,
  initialCategories,
  currentUserId,
}: {
  initialNotes: Note[];
  initialCategories: NoteCategory[];
  currentUserId: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", content: "", emoji: "📓", color: "#faf3e0", tags: "", categoryId: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", emoji: "📓", color: "#faf3e0", tags: "", categoryId: "" });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", emoji: "📂", color: "#f5f3ff", parentId: "" });

  const childrenMap = new Map<string, NoteCategory[]>();
  for (const c of categories) {
    const key = c.parentId || "root";
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(c);
  }
  const rootCategories = childrenMap.get("root") || [];

  const descendants = (categoryId: string): Set<string> => {
    const set = new Set<string>();
    const stack = [categoryId];
    while (stack.length) {
      const id = stack.pop()!;
      set.add(id);
      const kids = childrenMap.get(id) || [];
      for (const k of kids) stack.push(k.id);
    }
    return set;
  };

  const visibleNotes = notes.filter((n) => {
    const textOk =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    if (!textOk) return false;
    if (!selectedCategoryId) return !n.categoryId;
    const ids = descendants(selectedCategoryId);
    return n.categoryId ? ids.has(n.categoryId) : false;
  });

  const pinned = visibleNotes.filter((n) => n.pinned);
  const unpinned = visibleNotes.filter((n) => !n.pinned);

  const noteToDraft = (note: Note) => ({
    title: note.title,
    content: note.content,
    emoji: note.emoji,
    color: note.color,
    tags: note.tags.join(", "),
    categoryId: note.categoryId || "",
  });

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setEditDraft(noteToDraft(note));
  };

  const handleAdd = async () => {
    if (!newNote.title && !newNote.content) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newNote.title || "Нотатка",
        content: newNote.content,
        emoji: newNote.emoji,
        color: newNote.color,
        categoryId: newNote.categoryId || null,
        tags: newNote.tags ? newNote.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      }),
    });
    const note = await res.json();
    setNotes((prev) => [note, ...prev]);
    setShowAdd(false);
    setNewNote({ title: "", content: "", emoji: "📓", color: "#faf3e0", tags: "", categoryId: "" });
    toast.success("Нотатку збережено! 📓");
  };

  const handlePin = async (note: Note) => {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    const updated = await res.json();
    setNotes((prev) => prev.map((n) => n.id === note.id ? updated : n).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    setEditingNote((prev) => (prev && prev.id === note.id ? updated : prev));
    setEditDraft((prev) =>
      editingNote && editingNote.id === note.id
        ? {
            ...prev,
            emoji: updated.emoji,
            color: updated.color,
            title: updated.title,
            content: updated.content,
            tags: (updated.tags || []).join(", "),
            categoryId: updated.categoryId || "",
          }
        : prev
    );
    toast.success(updated.pinned ? "Закріплено 📌" : "Відкріплено");
  };

  const handleSaveEdit = async () => {
    if (!editingNote) return;
    const payload = {
      title: editDraft.title || "Нотатка",
      content: editDraft.content,
      emoji: editDraft.emoji,
      color: editDraft.color,
      categoryId: editDraft.categoryId || null,
      tags: editDraft.tags ? editDraft.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };
    const res = await fetch(`/api/notes/${editingNote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    setNotes((prev) => prev.map((n) => (n.id === editingNote.id ? updated : n)).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
    setEditingNote(updated);
    setEditDraft(noteToDraft(updated));
    toast.success("Нотатку оновлено");
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    const res = await fetch("/api/notes/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCategory.name.trim(),
        emoji: newCategory.emoji,
        color: newCategory.color,
        parentId: newCategory.parentId || null,
      }),
    });
    const category = await res.json();
    setCategories((prev) => [...prev, category]);
    setShowAddCategory(false);
    setNewCategory({ name: "", emoji: "📂", color: "#f5f3ff", parentId: "" });
    toast.success("Категорію додано");
  };

  const categoryOptions: NoteCategory[] = [];
  const walkCategories = (parentId: string | null, level: number) => {
    const arr = parentId ? childrenMap.get(parentId) || [] : rootCategories;
    for (const c of arr) {
      categoryOptions.push({ ...c, name: `${level > 0 ? "↳ ".repeat(level) : ""}${c.name}` });
      walkCategories(c.id, level + 1);
    }
  };
  walkCategories(null, 0);

  const handleDelete = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setEditingNote(null);
    toast.success("Нотатку видалено");
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => openEdit(note)}
      className="rounded-2xl cursor-pointer transition-shadow relative group bg-white border border-warm-200/90 shadow-cozy hover:shadow-cozy-hover overflow-hidden flex flex-col min-h-[140px]"
    >
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: note.color }}
      />
      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-2xl leading-none shrink-0">{note.emoji}</span>
          {note.pinned && (
            <Pin size={14} className="text-rose-400 fill-rose-200 shrink-0 mt-0.5" />
          )}
        </div>
        <h3 className="font-semibold text-warm-900 text-sm leading-snug mb-2 line-clamp-2 break-words">
          {note.title}
        </h3>
        {note.category && (
          <p className="text-[10px] text-warm-500 mb-1">
            {note.category.emoji} {note.category.name}
          </p>
        )}
        <p className="text-xs text-warm-600 line-clamp-4 leading-relaxed break-words flex-1">
          {note.content || "…"}
        </p>
        {note.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-3">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium bg-warm-100 text-warm-600 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-warm-100">
          <p className="text-[10px] text-warm-400">{formatDate(note.updatedAt)}</p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePin(note);
              }}
              className="w-8 h-8 rounded-lg bg-warm-50 hover:bg-warm-100 flex items-center justify-center text-warm-500"
            >
              <Pin size={12} className={note.pinned ? "text-rose-500 fill-rose-400" : ""} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(note.id);
              }}
              className="w-8 h-8 rounded-lg bg-warm-50 hover:bg-rose-50 flex items-center justify-center text-warm-400 hover:text-rose-500"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук нотаток..." className="w-full pl-10 pr-4 py-2.5 bg-white/80 rounded-2xl border border-warm-200 text-sm outline-none focus:border-rose-300 shadow-sm" />
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cream-400 to-cream-300 text-warm-800 rounded-2xl text-sm font-medium shadow-cozy border border-cream-300">
          <Plus size={16} /> Нова нотатка
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddCategory(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-warm-200 text-warm-700 rounded-2xl text-sm font-medium shadow-sm">
          <FolderPlus size={16} /> Категорія
        </motion.button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs border ${selectedCategoryId === null ? "bg-rose-100 border-rose-300 text-rose-700" : "bg-white border-warm-200 text-warm-600"}`}
          >
            📌 Корінь
          </button>
          {rootCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs border ${selectedCategoryId === cat.id ? "bg-rose-100 border-rose-300 text-rose-700" : "bg-white border-warm-200 text-warm-600"}`}
              style={{ borderColor: selectedCategoryId === cat.id ? undefined : cat.color }}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
        {rootCategories.map((cat) => {
          const children = childrenMap.get(cat.id) || [];
          if (children.length === 0) return null;
          return (
            <div key={cat.id} className="flex items-center gap-1 flex-wrap mb-1">
              <span className="text-[10px] text-warm-400 mr-1">{cat.name}:</span>
              {children.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(ch.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] border ${selectedCategoryId === ch.id ? "bg-rose-100 border-rose-300 text-rose-700" : "bg-white border-warm-200 text-warm-600"}`}
                >
                  {ch.emoji} {ch.name}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-warm-400 mb-3 flex items-center gap-1">
            <Pin size={12} /> ЗАКРІПЛЕНІ
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {pinned.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* All notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && <p className="text-xs font-semibold text-warm-400 mb-3">ІНШІ</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {unpinned.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {visibleNotes.length === 0 && (
        <div className="text-center py-16 text-warm-400">
          <div className="text-5xl mb-4">📓</div>
          <p className="text-lg font-semibold mb-2">Нотаток поки немає</p>
          <p className="text-sm">Записуйте ідеї, плани, думки</p>
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-lg max-h-[min(92dvh,760px)] flex flex-col rounded-3xl bg-white shadow-cozy-lg border border-warm-200 overflow-hidden"
            >
              <div
                className="h-2 w-full shrink-0"
                style={{ backgroundColor: newNote.color }}
              />
              <div className="overflow-y-auto overscroll-contain p-5 flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <p className="text-sm font-semibold text-warm-800">Нова нотатка</p>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="w-9 h-9 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-[10px] font-medium text-warm-400 uppercase tracking-wide mb-2">Емодзі</p>
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-20 overflow-y-auto">
                  {NOTE_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setNewNote((p) => ({ ...p, emoji: e }))}
                      className={`text-lg w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                        newNote.emoji === e
                          ? "bg-rose-50 border-rose-300"
                          : "bg-warm-50 border-transparent hover:border-warm-200"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-medium text-warm-400 uppercase tracking-wide mb-2">Колір смуги</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewNote((p) => ({ ...p, color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newNote.color === c ? "border-warm-700 scale-110" : "border-warm-200 hover:border-warm-300"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  value={newNote.title}
                  onChange={(e) => setNewNote((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Заголовок"
                  className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm font-semibold text-warm-900 placeholder:text-warm-400 outline-none border border-warm-200 focus:border-rose-300 mb-3"
                />
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Текст нотатки…"
                  rows={5}
                  className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm text-warm-800 placeholder:text-warm-400 outline-none border border-warm-200 focus:border-rose-300 resize-none mb-3"
                />
                <input
                  value={newNote.tags}
                  onChange={(e) => setNewNote((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="Теги через кому"
                  className="w-full bg-warm-50 rounded-xl px-4 py-2.5 text-xs text-warm-700 placeholder:text-warm-400 outline-none border border-warm-200 mb-4"
                />
                <select
                  value={newNote.categoryId}
                  onChange={(e) => setNewNote((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full bg-warm-50 rounded-xl px-4 py-2.5 text-xs text-warm-700 outline-none border border-warm-200 mb-4"
                >
                  <option value="">Корінь</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? "↳ " : ""}{c.emoji} {c.name}
                    </option>
                  ))}
                </select>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  className="w-full py-3 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-2xl font-semibold text-sm"
                >
                  Зберегти {newNote.emoji}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingNote(null)}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-lg max-h-[min(92dvh,760px)] flex flex-col rounded-3xl bg-white shadow-cozy-lg border border-warm-200 overflow-hidden"
            >
              <div
                className="h-2 w-full shrink-0"
                style={{ backgroundColor: editingNote.color }}
              />
              <div className="overflow-y-auto overscroll-contain p-5 flex-1 min-h-0">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0">{editingNote.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-warm-500 truncate">{editingNote.author.name}</p>
                      <p className="text-[10px] text-warm-400">{formatDate(editingNote.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePin(editingNote)}
                      className="w-9 h-9 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-600 flex items-center justify-center"
                    >
                      <Pin size={14} className={editingNote.pinned ? "text-rose-500 fill-rose-400" : ""} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(editingNote.id)}
                      className="w-9 h-9 rounded-xl bg-warm-100 hover:bg-rose-100 text-warm-500 hover:text-rose-600 flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNote(null)}
                      className="w-9 h-9 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-warm-400 uppercase tracking-wide mb-2">Емодзі</p>
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-20 overflow-y-auto">
                  {NOTE_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEditDraft((p) => ({ ...p, emoji: e }))}
                      className={`text-lg w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
                        editDraft.emoji === e
                          ? "bg-rose-50 border-rose-300"
                          : "bg-warm-50 border-transparent hover:border-warm-200"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-medium text-warm-400 uppercase tracking-wide mb-2">Колір смуги</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditDraft((p) => ({ ...p, color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        editDraft.color === c ? "border-warm-700 scale-110" : "border-warm-200 hover:border-warm-300"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Заголовок"
                  className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm font-semibold text-warm-900 placeholder:text-warm-400 outline-none border border-warm-200 focus:border-rose-300 mb-3"
                />
                <textarea
                  value={editDraft.content}
                  onChange={(e) => setEditDraft((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Текст нотатки…"
                  rows={5}
                  className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm text-warm-800 placeholder:text-warm-400 outline-none border border-warm-200 focus:border-rose-300 resize-none mb-3"
                />
                <input
                  value={editDraft.tags}
                  onChange={(e) => setEditDraft((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="Теги через кому"
                  className="w-full bg-warm-50 rounded-xl px-4 py-2.5 text-xs text-warm-700 placeholder:text-warm-400 outline-none border border-warm-200 mb-4"
                />
                <select
                  value={editDraft.categoryId}
                  onChange={(e) => setEditDraft((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full bg-warm-50 rounded-xl px-4 py-2.5 text-xs text-warm-700 outline-none border border-warm-200 mb-4"
                >
                  <option value="">Корінь</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? "↳ " : ""}{c.emoji} {c.name}
                    </option>
                  ))}
                </select>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEdit}
                  className="w-full py-3 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Save size={14} /> Зберегти зміни
                </motion.button>
                {(editingNote.tags.length > 0 || editDraft.tags) && (
                  <div className="flex gap-1 flex-wrap mt-4 pt-4 border-t border-warm-100">
                    {(editDraft.tags ? editDraft.tags.split(",").map((t) => t.trim()).filter(Boolean) : []).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium bg-warm-100 text-warm-600 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCategory(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-10 w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-cozy-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-warm-800">Нова категорія</p>
                  <button type="button" onClick={() => setShowAddCategory(false)} className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center">
                    <X size={15} />
                  </button>
                </div>
                <input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Назва категорії"
                  className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm text-warm-800 border border-warm-200 outline-none mb-3"
                />
                <select
                  value={newCategory.parentId}
                  onChange={(e) => setNewCategory((p) => ({ ...p, parentId: e.target.value }))}
                  className="w-full bg-warm-50 rounded-xl px-4 py-2.5 text-xs text-warm-700 border border-warm-200 outline-none mb-3"
                >
                  <option value="">Коренева категорія</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {CATEGORY_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setNewCategory((p) => ({ ...p, emoji: e }))}
                      className={`text-lg w-9 h-9 rounded-xl flex items-center justify-center border ${newCategory.emoji === e ? "bg-rose-50 border-rose-300" : "bg-warm-50 border-transparent"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCategory((p) => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 ${newCategory.color === c ? "border-warm-700 scale-110" : "border-warm-200"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="w-full py-3 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-2xl font-semibold text-sm"
                >
                  Створити категорію
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
