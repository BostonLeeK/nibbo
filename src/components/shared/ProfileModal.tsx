"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { USER_COLORS, USER_EMOJIS } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  color: string;
  emoji: string;
  familyId?: string | null;
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaved: (user: UserProfile) => void;
}

export default function ProfileModal({ open, onClose, user, onSaved }: ProfileModalProps) {
  const [name, setName] = useState(user.name ?? "");
  const [emoji, setEmoji] = useState(user.emoji || "🌸");
  const [color, setColor] = useState(user.color || "#f43f5e");
  const [busy, setBusy] = useState(false);
  const [familyBusy, setFamilyBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [familyMembers, setFamilyMembers] = useState<
    { id: string; name: string | null; email: string | null; emoji: string; color: string }[]
  >([]);
  const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string }[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<"OWNER" | "MEMBER" | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(user.name ?? "");
    setEmoji(user.emoji || "🌸");
    setColor(user.color || "#f43f5e");
  }, [open, user.name, user.emoji, user.color]);

  useEffect(() => {
    if (!open) return;
    const loadFamily = async () => {
      setFamilyBusy(true);
      try {
        const res = await fetch("/api/family/members");
        if (!res.ok) return;
        const data = await res.json();
        setFamilyMembers(data.members || []);
        setPendingInvites(data.invitations || []);
        setCurrentUserRole(data.currentUserRole || null);
      } finally {
        setFamilyBusy(false);
      }
    };
    void loadFamily();
  }, [open]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emoji, color }),
      });
      if (!res.ok) return;
      const next = await res.json();
      onSaved(next);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    setBusy(true);
    try {
      const res = await fetch("/api/users/avatar", { method: "POST", body: form });
      if (!res.ok) return;
      const next = await res.json();
      onSaved(next);
    } finally {
      setBusy(false);
    }
  };

  const invite = async () => {
    if (currentUserRole !== "OWNER") return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setFamilyBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return;
      setInviteEmail("");
      const listRes = await fetch("/api/family/members");
      if (!listRes.ok) return;
      const data = await listRes.json();
      setFamilyMembers(data.members || []);
      setPendingInvites(data.invitations || []);
    } finally {
      setFamilyBusy(false);
    }
  };

  const leaveFamily = async () => {
    if (currentUserRole !== "MEMBER") return;
    if (!confirm("Вийти з цієї сім'ї?")) return;
    setFamilyBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: user.id }),
      });
      if (!res.ok) return;
      const meRes = await fetch("/api/users/me");
      if (!meRes.ok) return;
      const next = await meRes.json();
      onSaved(next);
      onClose();
    } finally {
      setFamilyBusy(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
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
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-warm-800">Профіль</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <Image src={user.image} alt={user.name || "User"} width={52} height={52} className="rounded-2xl ring-2 ring-rose-100 object-cover" unoptimized={user.image.startsWith("/api/users/avatar/")} />
                  ) : (
                    <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl text-white" style={{ backgroundColor: color }}>
                      {emoji}
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-xl cursor-pointer">
                    <Upload size={13} />
                    Завантажити фото
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ім'я"
                  className="w-full bg-warm-50 rounded-xl px-4 py-3 text-sm text-warm-800 border border-warm-200 outline-none focus:border-rose-300"
                />
                <div>
                  <p className="text-xs font-semibold text-warm-500 mb-2">Іконка</p>
                  <div className="flex flex-wrap gap-2">
                    {USER_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center ${emoji === e ? "bg-rose-100 ring-2 ring-rose-300" : "bg-warm-50 hover:bg-warm-100"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-warm-500 mb-2">Колір</p>
                  <div className="flex gap-2">
                    {USER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-warm-400" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={save}
                  className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-medium disabled:opacity-60"
                >
                  Зберегти
                </button>
                <div className="pt-2 border-t border-warm-100">
                  <p className="text-xs font-semibold text-warm-500 mb-2">Родина</p>
                  <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                    {familyMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 bg-warm-50 rounded-xl px-3 py-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                          style={{ backgroundColor: m.color || "#f43f5e" }}
                        >
                          {m.emoji || "🌸"}
                        </div>
                        <span className="text-xs text-warm-700">{m.name || m.email || "Учасник"}</span>
                      </div>
                    ))}
                    {pendingInvites.map((i) => (
                      <div key={i.id} className="text-xs text-warm-400 px-1">
                        Запрошено: {i.email}
                      </div>
                    ))}
                    {!familyBusy && familyMembers.length === 0 && (
                      <p className="text-xs text-warm-400 px-1">Поки тільки ти в родині</p>
                    )}
                  </div>
                  {currentUserRole === "OWNER" ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email рідного"
                        className="flex-1 bg-warm-50 rounded-xl px-3 py-2 text-xs text-warm-800 border border-warm-200 outline-none focus:border-rose-300"
                      />
                      <button
                        type="button"
                        disabled={familyBusy}
                        onClick={invite}
                        className="px-3 py-2 text-xs rounded-xl bg-lavender-500 hover:bg-lavender-600 text-white disabled:opacity-60"
                      >
                        Додати
                      </button>
                    </div>
                  ) : currentUserRole === "MEMBER" ? (
                    <button
                      type="button"
                      disabled={familyBusy}
                      onClick={leaveFamily}
                      className="mt-2 w-full px-3 py-2 text-xs rounded-xl bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-60"
                    >
                      Вийти із сім'ї
                    </button>
                  ) : (
                    <div className="mt-2 h-8 rounded-xl bg-warm-50 border border-warm-100" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
