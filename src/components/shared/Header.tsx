"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import Image from "next/image";
import NotificationBell from "./NotificationBell";
import ProfileModal from "./ProfileModal";

interface HeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    color: string;
    emoji: string;
  };
  greeting: string;
  dateLabel: string;
}

export default function Header({ user: u, greeting, dateLabel }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState(u);
  const [openProfile, setOpenProfile] = useState(false);

  return (
    <header className="h-16 bg-white/60 backdrop-blur-md border-b border-warm-100 flex items-center px-6 gap-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-warm-700">
          {greeting}, <span className="text-rose-500">{user.name?.split(" ")[0] || "друже"}</span> 🌸
        </p>
        <p className="text-xs text-warm-400">{dateLabel}</p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-9 h-9 rounded-xl bg-warm-50 hover:bg-rose-50 flex items-center justify-center text-warm-500 hover:text-rose-500 transition-colors"
          title="Вийти"
        >
          <LogOut size={16} />
        </motion.button>
        <button
          type="button"
          onClick={() => setOpenProfile(true)}
          className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-rose-100"
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={36}
              height={36}
              className="w-9 h-9 object-cover"
              unoptimized={user.image.startsWith("/api/users/avatar/")}
            />
          ) : (
            <div className="w-9 h-9 text-sm text-white flex items-center justify-center" style={{ backgroundColor: user.color }}>
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
