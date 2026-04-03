"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const decorations = ["🌸", "🍀", "⭐", "🌙", "🎀", "🦋", "🌺", "✨"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-rose-50/40 to-lavender-50/30 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Floating decorations */}
      {decorations.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl select-none pointer-events-none"
          style={{
            left: `${10 + (i * 12) % 80}%`,
            top: `${5 + (i * 13) % 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [-5, 5, -5],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        >
          {emoji}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-cozy-lg p-10 text-center border border-white/60">
          {/* Logo */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-7xl mb-6"
          >
            🏠
          </motion.div>

          <h1 className="text-3xl font-bold text-warm-800 mb-2">Nibbo</h1>
          <p className="text-warm-500 mb-8 text-sm">
            Затишне місце для вашої родини 🌸
          </p>

          {/* Features preview */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { emoji: "📋", label: "Задачі" },
              { emoji: "📅", label: "Календар" },
              { emoji: "🍽️", label: "Меню" },
              { emoji: "📓", label: "Нотатки" },
              { emoji: "💰", label: "Бюджет" },
              { emoji: "🛒", label: "Покупки" },
            ].map((f) => (
              <motion.div
                key={f.label}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-cream-50 rounded-2xl p-3 border border-cream-200"
              >
                <div className="text-2xl mb-1">{f.emoji}</div>
                <div className="text-xs text-warm-500 font-medium">{f.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Google Sign In */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-warm-200 hover:border-rose-300 rounded-2xl px-6 py-4 font-semibold text-warm-700 shadow-cozy hover:shadow-cozy-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full"
              />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="group-hover:text-rose-600 transition-colors">
              {loading ? "Входимо..." : "Увійти через Google"}
            </span>
          </motion.button>

          <p className="text-xs text-warm-400 mt-4">
            Тут ви можете організувати свою родину та управляти домашніми справами
          </p>
        </div>
      </motion.div>
    </div>
  );
}
