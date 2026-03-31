"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", label: "Головна", emoji: "🏠" },
  { href: "/tasks", label: "Задачі", emoji: "📋" },
  { href: "/calendar", label: "Календар", emoji: "📅" },
  { href: "/menu", label: "Меню", emoji: "🍽️" },
  { href: "/notes", label: "Нотатки", emoji: "📓" },
  { href: "/budget", label: "Бюджет", emoji: "💰" },
  { href: "/shopping", label: "Покупки", emoji: "🛒" },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Sidebar({ user: u }: SidebarProps) {
  const user = u ?? { name: null, email: null, image: null };
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-64 h-full bg-white/80 backdrop-blur-md border-r border-warm-100 flex flex-col shadow-cozy z-10"
    >
      {/* Logo */}
      <div className="p-6 border-b border-warm-100">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3"
        >
          <span className="text-3xl">🏠</span>
          <div>
            <h1 className="font-bold text-warm-800 text-lg leading-tight">Цифровий дім</h1>
            <p className="text-xs text-warm-400">Родинний простір</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all relative",
                    isActive
                      ? "bg-gradient-to-r from-rose-50 to-rose-100/50 text-rose-700 shadow-sm"
                      : "text-warm-600 hover:bg-warm-50 hover:text-warm-800"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-gradient-to-r from-rose-100 to-rose-50 rounded-2xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="text-xl relative z-10">{item.emoji}</span>
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400 relative z-10" />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-warm-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-warm-50">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={36}
              height={36}
              className="rounded-full ring-2 ring-rose-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-lg">
              🌸
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-warm-800 text-sm truncate">{user.name}</p>
            <p className="text-xs text-warm-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
