"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn, normalizeProfileEmoji } from "@/lib/utils";
import Image from "next/image";
import {
  CalendarDays,
  CreditCard,
  House,
  Menu,
  NotebookPen,
  Repeat2,
  ShoppingCart,
  SquareKanban,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { I18N } from "@/lib/i18n";
import { useAppLanguage } from "@/hooks/useAppLanguage";

const mobileMenuIconBtnClass =
  "min-h-[44px] min-w-[44px] shrink-0 rounded-2xl border-2 border-rose-300/80 bg-white text-rose-600 shadow-sm flex items-center justify-center transition-transform touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2";

const mobileTopBarClass =
  "flex min-h-[52px] shrink-0 items-center justify-between gap-2 border-b border-warm-100 px-3 py-2";

const navItems = [
  { href: "/dashboard", key: "dashboard", Icon: House },
  { href: "/family", key: "family", Icon: Users },
  { href: "/tasks", key: "tasks", Icon: SquareKanban },
  { href: "/calendar", key: "calendar", Icon: CalendarDays },
  { href: "/menu", key: "menu", Icon: UtensilsCrossed },
  { href: "/notes", key: "notes", Icon: NotebookPen },
  { href: "/budget", key: "budget", Icon: CreditCard },
  { href: "/subscriptions", key: "subscriptions", Icon: Repeat2 },
  { href: "/shopping", key: "shopping", Icon: ShoppingCart },
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
  const user = {
    name: u?.name ?? null,
    email: u?.email ?? null,
    image: u?.image ?? null,
    color: u?.color ?? "#f43f5e",
    emoji: normalizeProfileEmoji(u?.emoji),
  };
  const { language } = useAppLanguage();
  const t = I18N[language];
  const pathname = usePathname();
  const [openMobileMenu, setOpenMobileMenu] = useState(false);

  return (
    <>
      <aside className="md:hidden bg-white/85 backdrop-blur-md shadow-sm">
        <div className={mobileTopBarClass}>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Image src="/favicon.svg" alt="Nibbo logo" width={24} height={24} className="shrink-0" />
            <h1 className="truncate font-bold text-warm-800 text-base leading-tight">Nibbo</h1>
          </div>
          <button
            type="button"
            onClick={() => setOpenMobileMenu(true)}
            className={mobileMenuIconBtnClass}
            aria-label={t.openMenuAria}
          >
            <Menu size={20} strokeWidth={2} aria-hidden />
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
            <div className="flex h-full flex-col">
              <div className={mobileTopBarClass}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Image src="/favicon.svg" alt="Nibbo logo" width={24} height={24} className="shrink-0" />
                  <h2 className="truncate font-bold text-warm-800 text-base leading-tight">{t.mobileMenuTitle}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenMobileMenu(false)}
                  className={mobileMenuIconBtnClass}
                  aria-label={t.closeMenuAria}
                >
                  <X size={20} strokeWidth={2} aria-hidden />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 pb-2 pt-3">
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
                          "flex min-h-[52px] items-center gap-3 rounded-2xl border px-3 py-2.5 text-[15px] font-semibold leading-snug transition-colors",
                          isActive
                            ? "border-rose-200/90 bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 shadow-sm"
                            : "border-warm-100 bg-warm-50/90 text-warm-800 shadow-sm"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                            isActive
                              ? "border-rose-200/70 bg-white text-rose-600"
                              : "border-warm-100/80 bg-white text-warm-600"
                          )}
                          aria-hidden
                        >
                          <item.Icon size={18} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">{t.nav[item.key as keyof typeof t.nav]}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
              <div className="mx-3 mb-3 mt-4 rounded-2xl border border-warm-100 bg-warm-50 p-3">
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
                      {user.name?.[0] || "U"}
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
                    <item.Icon size={18} className="relative z-10" />
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
                {user.name?.[0] || "U"}
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
