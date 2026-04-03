"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, TrendingDown, TrendingUp } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

interface User { id: string; name: string | null; image: string | null; color: string; emoji: string; }
interface Category { id: string; name: string; emoji: string; color: string; budget: number | null; }
interface Expense { id: string; title: string; amount: number; date: string; note: string | null; category: Category | null; user: User; }

const CAT_EMOJIS = ["🛒", "🏠", "🚗", "💊", "🎮", "👕", "🍕", "✈️", "📚", "💇", "🐾", "💡", "📱", "🎁", "💰"];
const CAT_COLORS = ["#4ade80", "#38bdf8", "#fb923c", "#f43f5e", "#818cf8", "#c084fc", "#f472b6", "#facc15"];

export default function BudgetView({ initialCategories, initialExpenses, currentUserId }: {
  initialCategories: Category[];
  initialExpenses: Expense[];
  currentUserId: string;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", categoryId: "", note: "", date: new Date().toISOString().split("T")[0] });
  const [newCat, setNewCat] = useState({ name: "", emoji: "💰", color: "#4ade80", budget: "" });

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = categories.map((cat) => ({
    ...cat,
    spent: expenses.filter((e) => e.category?.id === cat.id).reduce((s, e) => s + e.amount, 0),
  }));

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        categoryId: newExpense.categoryId || undefined,
        note: newExpense.note,
        date: new Date(newExpense.date).toISOString(),
      }),
    });
    const expense = await res.json();
    setExpenses((prev) => [expense, ...prev]);
    setShowAddExpense(false);
    setNewExpense({ title: "", amount: "", categoryId: "", note: "", date: new Date().toISOString().split("T")[0] });
    toast.success("Витрату додано! 💰");
  };

  const handleDeleteExpense = async (id: string) => {
    await fetch(`/api/budget/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success("Видалено");
  };

  const handleAddCategory = async () => {
    if (!newCat.name) return;
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "category", name: newCat.name, emoji: newCat.emoji, color: newCat.color, budget: newCat.budget ? parseFloat(newCat.budget) : undefined }),
    });
    const cat = await res.json();
    setCategories((prev) => [...prev, cat]);
    setShowAddCategory(false);
    setNewCat({ name: "", emoji: "💰", color: "#4ade80", budget: "" });
    toast.success("Категорію додано! ✅");
  };

  return (
    <div className="space-y-5 md:space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-sage-400 to-sage-500 rounded-3xl p-4 md:p-6 text-white shadow-cozy">
        <p className="text-sage-100 text-sm mb-1">Витрачено цього місяця</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{formatCurrency(totalSpent)}</h2>
        <div className="grid grid-cols-2 gap-2 md:flex md:gap-4">
          <div className="bg-white/20 rounded-2xl px-4 py-2">
            <p className="text-xs text-sage-100">Транзакцій</p>
            <p className="font-bold">{expenses.length}</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2">
            <p className="text-xs text-sage-100">Категорій</p>
            <p className="font-bold">{categories.length}</p>
          </div>
        </div>
      </motion.div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-warm-800">Категорії 📊</h3>
          <button onClick={() => setShowAddCategory(true)} className="text-xs text-sage-600 hover:text-sage-700 font-medium flex items-center gap-1">
            <Plus size={14} /> Категорія
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {byCategory.map((cat) => {
            const pct = cat.budget ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
            const overBudget = cat.budget && cat.spent > cat.budget;
            return (
              <motion.div key={cat.id} whileHover={{ y: -2 }}
                className="bg-white/80 rounded-2xl p-4 shadow-cozy border border-warm-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-xs font-semibold text-warm-700 truncate">{cat.name}</span>
                </div>
                <p className="text-lg font-bold text-warm-800">{formatCurrency(cat.spent)}</p>
                {cat.budget && (
                  <>
                    <p className="text-xs text-warm-400 mb-2">з {formatCurrency(cat.budget)}</p>
                    <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: overBudget ? "#f43f5e" : cat.color }} />
                    </div>
                    {overBudget && <p className="text-xs text-rose-500 mt-1">⚠️ Перевищено</p>}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h3 className="font-bold text-warm-800">Транзакції цього місяця</h3>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddExpense(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-sage-500 to-sage-400 text-white rounded-2xl text-sm font-medium shadow-cozy w-full sm:w-auto">
            <Plus size={14} /> Додати витрату
          </motion.button>
        </div>

        <div className="bg-white/70 rounded-3xl shadow-cozy border border-warm-100 overflow-hidden">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-warm-400">
              <div className="text-4xl mb-3">💸</div>
              <p>Витрат поки немає</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-50">
              {expenses.map((expense) => (
                <motion.div key={expense.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 md:gap-4 px-3 md:px-5 py-3 hover:bg-warm-50/50 transition-colors group">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: (expense.category?.color || "#e7e5e4") + "20" }}>
                    {expense.category?.emoji || "💰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-warm-800 text-sm">{expense.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {expense.category && <span className="text-xs text-warm-400">{expense.category.name}</span>}
                      <span className="text-xs text-warm-300">•</span>
                      <span className="text-xs text-warm-400">{formatDate(expense.date)}</span>
                      <span className="text-xs text-warm-400">• {expense.user.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm md:text-base text-warm-800">{formatCurrency(expense.amount)}</span>
                    <button onClick={() => handleDeleteExpense(expense.id)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-warm-300 hover:text-rose-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showAddExpense && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddExpense(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative z-10 w-full max-w-md">
              <div className="bg-white rounded-3xl shadow-cozy-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-warm-800">Нова витрата 💰</h2>
                  <button onClick={() => setShowAddExpense(false)} className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <input value={newExpense.title} onChange={(e) => setNewExpense((p) => ({ ...p, title: e.target.value }))}
                    placeholder="На що витратили?" className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-sage-400" />
                  <input type="number" value={newExpense.amount} onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="Сума (грн)" className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-sage-400" />
                  <select value={newExpense.categoryId} onChange={(e) => setNewExpense((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-sage-400">
                    <option value="">{"Категорія (необов'язково)"}</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                  <input type="date" value={newExpense.date} onChange={(e) => setNewExpense((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-sage-400" />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleAddExpense}
                    className="w-full py-3 bg-gradient-to-r from-sage-500 to-sage-400 text-white rounded-2xl font-semibold">
                    Зберегти 💰
                  </motion.button>
                </div>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showAddCategory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddCategory(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative z-10 w-full max-w-sm">
              <div className="bg-white rounded-3xl shadow-cozy-lg p-4 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-warm-800">Нова категорія</h2>
                  <button onClick={() => setShowAddCategory(false)} className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-1 flex-wrap">
                    {CAT_EMOJIS.map((e) => (
                      <button key={e} onClick={() => setNewCat((p) => ({ ...p, emoji: e }))}
                        className={`text-xl w-9 h-9 rounded-xl flex items-center justify-center transition-all ${newCat.emoji === e ? "bg-sage-100 ring-2 ring-sage-400" : "hover:bg-warm-50"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {CAT_COLORS.map((c) => (
                      <button key={c} onClick={() => setNewCat((p) => ({ ...p, color: c }))}
                        className={`w-7 h-7 rounded-full transition-all ${newCat.color === c ? "ring-2 ring-offset-1 ring-warm-400 scale-110" : "hover:scale-105"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <input value={newCat.name} onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Назва категорії" className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-sage-400" />
                  <input type="number" value={newCat.budget} onChange={(e) => setNewCat((p) => ({ ...p, budget: e.target.value }))}
                    placeholder="Місячний бюджет (грн)" className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-sage-400" />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddCategory}
                    className="w-full py-3 bg-gradient-to-r from-sage-500 to-sage-400 text-white rounded-2xl font-semibold">
                    Створити {newCat.emoji}
                  </motion.button>
                </div>
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
