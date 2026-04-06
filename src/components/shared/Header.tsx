"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut, Sparkles } from "lucide-react";
import Image from "next/image";
import NotificationBell from "./NotificationBell";
import ProfileModal from "./ProfileModal";
import { TASK_POINTS_AWARDED_EVENT } from "@/lib/task-points";
import { I18N } from "@/lib/i18n";
import { useAppLanguage } from "@/hooks/useAppLanguage";

interface HeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    color: string;
    emoji: string;
  };
  initialPoints: number;
  isAdmin?: boolean;
}

export default function Header({ user: u, initialPoints, isAdmin = false }: HeaderProps) {
  const router = useRouter();
  const { language, setLanguage } = useAppLanguage();
  const t = I18N[language];
  const [user, setUser] = useState(u);
  const [openProfile, setOpenProfile] = useState(false);
  const [points, setPoints] = useState(initialPoints);

  useEffect(() => {
    setPoints(initialPoints);
  }, [initialPoints]);

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const res = await fetch("/api/users/points");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.points === "number") setPoints(data.points);
      } catch {}
    };
    void loadPoints();
  }, []);

  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Kyiv",
    }).format(now)
  );
  const greeting =
    language === "en"
      ? hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening"
      : hour < 12
        ? "Доброго ранку"
        : hour < 18
          ? "Доброго дня"
          : "Доброго вечора";
  const dateLabel = new Intl.DateTimeFormat(language === "en" ? "en-US" : "uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Kyiv",
  }).format(now);

  useEffect(() => {
    const onAwarded = (event: Event) => {
      const detail = (event as CustomEvent<{ points?: number }>).detail;
      const awarded = detail?.points ?? 0;
      if (awarded <= 0) return;
      setPoints((prev) => prev + awarded);
    };
    window.addEventListener(TASK_POINTS_AWARDED_EVENT, onAwarded as EventListener);
    return () => window.removeEventListener(TASK_POINTS_AWARDED_EVENT, onAwarded as EventListener);
  }, []);

  return (
    <header className="md:h-16 bg-white/60 backdrop-blur-md border-b border-warm-100 flex items-center px-3 md:px-6 py-2 md:py-0 gap-2 md:gap-4">
      <div className="flex-1">
        <p className="text-xs md:text-sm font-semibold text-warm-700">
          {greeting}, <span className="text-rose-500">{user.name?.split(" ")[0] || t.header.friendFallback}</span> 🌸
        </p>
        <div className="hidden md:flex items-center gap-2">
          <p className="text-xs text-warm-400">{dateLabel}</p>
          {isAdmin && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-sage-100 text-sage-700 border border-sage-200">
              ADMIN
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <div
          className="flex items-center gap-1 rounded-xl border border-warm-200 bg-white/80 px-1 py-1"
          aria-label={t.languageLabel}
          title={t.languageLabel}
        >
          <button
            type="button"
            onClick={() => setLanguage("uk")}
            className={`px-2 py-1 text-[11px] rounded-md font-semibold transition-colors ${
              language === "uk" ? "bg-rose-100 text-rose-700" : "text-warm-600 hover:bg-warm-100"
            }`}
          >
            UK
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-2 py-1 text-[11px] rounded-md font-semibold transition-colors ${
              language === "en" ? "bg-rose-100 text-rose-700" : "text-warm-600 hover:bg-warm-100"
            }`}
          >
            EN
          </button>
        </div>
        <Link
          data-tour="xp-badge"
          href="/achievements"
          className="h-8 md:h-9 px-2.5 md:px-3 rounded-xl bg-gradient-to-r from-lavender-100 to-rose-100 border border-lavender-200 flex items-center gap-1.5 md:gap-2 hover:from-lavender-200 hover:to-rose-200 transition-colors"
        >
          <Sparkles size={14} className="text-lavender-500" />
          <span className="text-xs font-semibold text-warm-700">{points} XP</span>
        </Link>
        <NotificationBell />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-warm-50 hover:bg-rose-50 flex items-center justify-center text-warm-500 hover:text-rose-500 transition-colors"
          title={t.header.logoutTitle}
        >
          <LogOut size={16} />
        </motion.button>
        <button
          data-tour="profile-button"
          type="button"
          onClick={() => setOpenProfile(true)}
          className="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden ring-2 ring-rose-100"
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || t.task.userFallback}
              width={36}
              height={36}
              className="w-8 h-8 md:w-9 md:h-9 object-cover"
              unoptimized={user.image.startsWith("/api/users/avatar/")}
            />
          ) : (
            <div className="w-8 h-8 md:w-9 md:h-9 text-sm text-white flex items-center justify-center" style={{ backgroundColor: user.color }}>
              {user.emoji}
            </div>
          )}
        </button>
      </div>
      <ProfileModal
        open={openProfile}
        onClose={() => setOpenProfile(false)}
        user={{
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          color: user.color,
          emoji: user.emoji,
        }}
        onSaved={(next) => {
          setUser(next);
          router.refresh();
        }}
      />
    </header>
  );
}
