"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const EMOJIS = ["📋", "🏠", "💼", "🎯", "🌟", "🛠️", "📚", "🎨", "🌱", "🚀"];
const COLORS = ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#818cf8", "#c084fc", "#f472b6"];

interface AddBoardModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, emoji: string, color: string) => void;
}

export default function AddBoardModal({ open, onClose, onAdd }: AddBoardModalProps) {
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📋");
  const [selectedColor, setSelectedColor] = useState("#f43f5e");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd(name, selectedEmoji, selectedColor);
    setName("");
    setSelectedEmoji("📋");
    setSelectedColor("#f43f5e");
  };

  return (
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
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-cozy-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-warm-800">Нова дошка 📋</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-warm-600 mb-2 block">Назва дошки</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Напр. Домашні справи"
                    className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm text-warm-800 placeholder:text-warm-400 outline-none border border-warm-200 focus:border-rose-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-warm-600 mb-2 block">Іконка</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setSelectedEmoji(e)}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                          selectedEmoji === e ? "bg-rose-100 ring-2 ring-rose-400 scale-110" : "bg-warm-50 hover:bg-warm-100"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-warm-600 mb-2 block">Колір</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          selectedColor === c ? "ring-2 ring-offset-2 ring-warm-400 scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-400 text-white rounded-2xl font-semibold hover:shadow-cozy transition-all mt-2"
                >
                  Створити дошку {selectedEmoji}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
