"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface User { id: string; name: string | null; image: string | null; color: string; emoji: string; }
interface ShoppingItem { id: string; name: string; quantity: string | null; unit: string | null; checked: boolean; category: string | null; addedBy: User; }
interface ShoppingList { id: string; name: string; emoji: string; items: ShoppingItem[]; }

const ITEM_CATEGORIES = ["Овочі 🥦", "Фрукти 🍎", "М'ясо 🥩", "Молочне 🧀", "Бакалія 🌾", "Напої 🧃", "Заморожені ❄️", "Інше 📦"];
const LIST_EMOJIS = ["🛒", "🏪", "🛍️", "🥕", "🧺", "🏬"];

export default function ShoppingView({ initialLists, currentUserId }: { initialLists: ShoppingList[]; currentUserId: string }) {
  const [lists, setLists] = useState(initialLists);
  const [activeList, setActiveList] = useState(lists[0]?.id || "");
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListEmoji, setNewListEmoji] = useState("🛒");
  const [newItem, setNewItem] = useState({ name: "", quantity: "", unit: "", category: "" });

  const currentList = lists.find((l) => l.id === activeList);
  const checkedItems = currentList?.items.filter((i) => i.checked) || [];
  const uncheckedItems = currentList?.items.filter((i) => !i.checked) || [];

  const handleAddList = async () => {
    if (!newListName.trim()) return;
    const res = await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "list", name: newListName, emoji: newListEmoji }),
    });
    const list = await res.json();
    setLists((prev) => [{ ...list, items: [] }, ...prev]);
    setActiveList(list.id);
    setShowAddList(false);
    setNewListName("");
    toast.success("Список створено! 🛒");
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim() || !activeList) return;
    const res = await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newItem.name, quantity: newItem.quantity || undefined, unit: newItem.unit || undefined, category: newItem.category || undefined, listId: activeList }),
    });
    const item = await res.json();
    setLists((prev) => prev.map((l) => l.id === activeList ? { ...l, items: [...l.items, item] } : l));
    setNewItem({ name: "", quantity: "", unit: "", category: "" });
    toast.success("Додано! ✅");
  };

  const handleToggle = async (item: ShoppingItem) => {
    const res = await fetch(`/api/shopping/${item.id}?type=item`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    });
    const updated = await res.json();
    setLists((prev) => prev.map((l) => l.id === activeList
      ? { ...l, items: l.items.map((i) => i.id === item.id ? updated : i).sort((a, b) => (a.checked ? 1 : 0) - (b.checked ? 1 : 0)) }
      : l
    ));
  };

  const handleDeleteItem = async (itemId: string) => {
    await fetch(`/api/shopping/${itemId}`, { method: "DELETE" });
    setLists((prev) => prev.map((l) => l.id === activeList ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l));
  };

  const progress = currentList && currentList.items.length > 0
    ? Math.round((checkedItems.length / currentList.items.length) * 100) : 0;

  return (
    <div className="h-full flex gap-6">
      {/* List sidebar */}
      <div className="w-56 flex flex-col gap-3">
        {lists.map((list) => (
          <motion.button key={list.id} whileHover={{ x: 4 }}
            onClick={() => setActiveList(list.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-2xl text-left transition-all",
              activeList === list.id ? "bg-white shadow-cozy text-warm-800" : "text-warm-500 hover:bg-white/50"
            )}>
            <span className="text-xl">{list.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{list.name}</p>
              <p className="text-xs text-warm-400">{list.items.length} товарів</p>
            </div>
          </motion.button>
        ))}
        <motion.button whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddList(true)}
          className="flex items-center gap-2 p-3 rounded-2xl text-warm-400 hover:text-rose-500 border-2 border-dashed border-warm-200 hover:border-rose-300 transition-all">
          <Plus size={16} />
          <span className="text-sm font-medium">Новий список</span>
        </motion.button>
      </div>

      {/* Main content */}
      {currentList ? (
        <div className="flex-1 flex flex-col">
          {/* Progress */}
          <div className="bg-white/80 rounded-3xl p-5 shadow-cozy border border-warm-100 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-warm-800">{currentList.emoji} {currentList.name}</h2>
                <p className="text-sm text-warm-400">{checkedItems.length} з {currentList.items.length} куплено</p>
              </div>
              <div className="text-3xl font-bold text-rose-500">{progress}%</div>
            </div>
            <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Add item form */}
          <div className="bg-white/70 rounded-3xl p-4 shadow-cozy border border-warm-100 mb-4">
            <div className="flex gap-2">
              <input value={newItem.name} onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                placeholder="Додати товар..." className="flex-1 bg-warm-50 rounded-xl px-4 py-2.5 text-sm outline-none border border-warm-200 focus:border-rose-300" />
              <input value={newItem.quantity} onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
                placeholder="К-сть" className="w-20 bg-warm-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-warm-200 focus:border-rose-300" />
              <input value={newItem.unit} onChange={(e) => setNewItem((p) => ({ ...p, unit: e.target.value }))}
                placeholder="Од." className="w-16 bg-warm-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-warm-200 focus:border-rose-300" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleAddItem}
                className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors">
                <Plus size={18} />
              </motion.button>
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {uncheckedItems.map((item) => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-white/80 rounded-2xl px-4 py-3 shadow-sm border border-warm-100 group hover:shadow-cozy transition-all">
                <button onClick={() => handleToggle(item)}
                  className="w-6 h-6 rounded-full border-2 border-warm-300 hover:border-rose-400 flex items-center justify-center transition-colors flex-shrink-0">
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-warm-800 text-sm">{item.name}</p>
                  <div className="flex items-center gap-2">
                    {(item.quantity || item.unit) && (
                      <span className="text-xs text-warm-400">{item.quantity} {item.unit}</span>
                    )}
                    {item.category && <span className="text-xs text-warm-400">{item.category}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                    style={{ backgroundColor: item.addedBy.color }}>
                    {item.addedBy.emoji || item.addedBy.name?.[0]}
                  </div>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-warm-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Checked items */}
            {checkedItems.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-warm-400 mb-2 px-1">✅ КУПЛЕНО ({checkedItems.length})</p>
                {checkedItems.map((item) => (
                  <motion.div key={item.id} layout
                    className="flex items-center gap-3 bg-warm-50/80 rounded-2xl px-4 py-3 border border-warm-100 mb-2 group opacity-60">
                    <button onClick={() => handleToggle(item)}
                      className="w-6 h-6 rounded-full bg-sage-400 border-2 border-sage-400 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-warm-500 text-sm line-through">{item.name}</p>
                    </div>
                    <button onClick={() => handleDeleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-warm-300 hover:text-rose-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {currentList.items.length === 0 && (
              <div className="text-center py-12 text-warm-400">
                <div className="text-5xl mb-3">🛒</div>
                <p className="font-semibold mb-1">Список порожній</p>
                <p className="text-sm">Додай товари вище</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-warm-400">
          <div className="text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="font-semibold mb-4">Немає списків покупок</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddList(true)}
              className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-medium hover:bg-rose-600 transition-colors">
              Створити список 🛒
            </motion.button>
          </div>
        </div>
      )}

      {/* Add List Modal */}
      <AnimatePresence>
        {showAddList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddList(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative z-10 w-full max-w-sm">
              <div className="bg-white rounded-3xl shadow-cozy-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-warm-800">Новий список 🛒</h2>
                  <button onClick={() => setShowAddList(false)} className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"><X size={16} /></button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {LIST_EMOJIS.map((e) => (
                      <button key={e} onClick={() => setNewListEmoji(e)}
                        className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${newListEmoji === e ? "bg-rose-100 ring-2 ring-rose-400 scale-110" : "hover:bg-warm-50"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <input value={newListName} onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddList()}
                    placeholder="Назва списку" className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm outline-none border border-warm-200 focus:border-rose-300" />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddList}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-400 text-white rounded-2xl font-semibold">
                    Створити {newListEmoji}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
