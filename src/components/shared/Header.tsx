"use client";

import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut, Bell } from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface HeaderProps {
  user: { name?: string | null; image?: string | null };
}

export default function Header({ user: u }: HeaderProps) {
  const user = u ?? { name: null, image: null };
  const greetings = ["Привіт", "Вітаю", "Доброго дня"];
  const greeting = greetings[Math.floor(Date.now() / 1000 / 3600) % greetings.length];
  const today = formatDate(new Date());

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-16 bg-white/60 backdrop-blur-md border-b border-warm-100 flex items-center px-6 gap-4"
    >
      {/* Greeting */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-warm-700">
          {greeting}, <span className="text-rose-500">{user.name?.split(" ")[0]}</span> 🌸
        </p>
        <p className="text-xs text-warm-400">{today}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-warm-50 hover:bg-warm-100 flex items-center justify-center text-warm-500 hover:text-warm-700 transition-colors"
        >
          <Bell size={16} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-9 h-9 rounded-xl bg-warm-50 hover:bg-rose-50 flex items-center justify-center text-warm-500 hover:text-rose-500 transition-colors"
          title="Вийти"
        >
          <LogOut size={16} />
        </motion.button>

        {user.image && (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={36}
            height={36}
            className="rounded-xl ring-2 ring-rose-100"
          />
        )}
      </div>
    </motion.header>
  );
}
