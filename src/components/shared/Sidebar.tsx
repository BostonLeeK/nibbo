"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { I18N } from "@/lib/i18n";
import { useAppLanguage } from "@/hooks/useAppLanguage";

const navItems = [
  { href: "/dashboard", key: "dashboard", emoji: "🏠" },
  { href: "/family", key: "family", emoji: "👨‍👩‍👧‍👦" },
  { href: "/tasks", key: "tasks", emoji: "📋" },
  { href: "/calendar", key: "calendar", emoji: "📅" },
  { href: "/menu", key: "menu", emoji: "🍽️" },
  { href: "/notes", key: "notes", emoji: "📓" },
  { href: "/budget", key: "budget", emoji: "💰" },
  { href: "/subscriptions", key: "subscriptions", emoji: "📺" },
  { href: "/shopping", key: "shopping", emoji: "🛒" },
];

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    color?: string;
    emoji?: string;
  };
}

export default function Sidebar({ user: u }: SidebarProps) {
  const user = u ?? { name: null, email: null, image: null, color: "#f43f5e", emoji: "🌸" };
  const { language } = useAppLanguage();
  const t = I18N[language];
  const pathname = usePathname();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  return (
    <>
      <aside className="md:hidden bg-white/85 backdrop-blur-md border-b border-warm-100 px-3 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/favicon.svg" alt="Nibbo logo" width={24} height={24} />
            <h1 className="font-bold text-warm-800 text-base leading-tight">Nibbo</h1>
          </div>
          <button
            type="button"
            onClick={() => setOpenMobileMenu(true)}
            className="w-9 h-9 rounded-xl bg-white border border-warm-200 text-warm-700 flex items-center justify-center"
            aria-label={t.openMenuAria}
          >
            <Menu size={18} />
          </button>
        </div>
      </aside>
      <AnimatePresence>
        {openMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[60] bg-white"
          >
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Image src="/favicon.svg" alt="Nibbo logo" width={30} height={30} />
                  <h2 className="text-xl font-bold text-warm-800">{t.mobileMenuTitle}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenMobileMenu(false)}
                  className="w-10 h-10 rounded-xl bg-warm-100 text-warm-700 flex items-center justify-center"
                  aria-label={t.closeMenuAria}
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const tourKey =
                    item.href === "/family"
                      ? "nav-family"
                      : item.href === "/menu"
                        ? "nav-menu"
                        : item.href === "/calendar"
                          ? "nav-calendar"
                          : item.href === "/notes"
                            ? "nav-notes"
                            : item.href === "/budget"
                              ? "nav-budget"
                              : undefined;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setOpenMobileMenu(false)} data-tour={tourKey}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-4 rounded-2xl font-semibold text-base transition-all",
                          isActive
                            ? "bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700"
                            : "bg-warm-50 text-warm-700"
                        )}
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <span>{t.nav[item.key as keyof typeof t.nav]}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 p-3 rounded-2xl bg-warm-50 border border-warm-100">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-rose-200"
                      unoptimized={user.image.startsWith("/api/users/avatar/")}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-base text-white"
                      style={{ backgroundColor: user.color || "#f43f5e" }}
                    >
                      {user.emoji || "🌸"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-warm-800 truncate">{user.name}</p>
                    <p className="text-xs text-warm-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <aside
        data-tour="sidebar-nav"
        className="hidden md:flex w-64 h-full bg-white/80 backdrop-blur-md border-r border-warm-100 flex-col shadow-cozy z-10"
      >
        <div className="p-6 border-b border-warm-100">
          <div className="flex items-center gap-3">
            <Image src="/favicon.svg" alt="Nibbo logo" width={32} height={32} />
            <div>
              <h1 className="font-bold text-warm-800 text-lg leading-tight">Nibbo</h1>
              <p className="text-xs text-warm-400">{t.dashboardHomeTagline}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const tourKey =
              item.href === "/family"
                ? "nav-family"
                : item.href === "/menu"
                  ? "nav-menu"
                  : item.href === "/calendar"
                    ? "nav-calendar"
                    : item.href === "/notes"
                      ? "nav-notes"
                      : item.href === "/budget"
                        ? "nav-budget"
                        : undefined;
            return (
              <div key={item.href}>
                <Link href={item.href} data-tour={tourKey}>
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
                    <span className="relative z-10">{t.nav[item.key as keyof typeof t.nav]}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400 relative z-10" />
                    )}
                  </motion.div>
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-warm-100">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-warm-50">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={36}
                height={36}
                className="rounded-full ring-2 ring-rose-200"
                unoptimized={user.image.startsWith("/api/users/avatar/")}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-lg text-white"
                style={{ backgroundColor: user.color || "#f43f5e" }}
              >
                {user.emoji || "🌸"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-warm-800 text-sm truncate">{user.name}</p>
              <p className="text-xs text-warm-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
