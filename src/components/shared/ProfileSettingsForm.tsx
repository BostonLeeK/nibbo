"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { USER_COLORS, USER_EMOJIS, normalizeProfileEmoji } from "@/lib/utils";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { I18N } from "@/lib/i18n";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  color: string;
  emoji: string;
  familyId?: string | null;
}

interface ProfileSettingsFormProps {
  initialUser: UserProfile;
}

export default function ProfileSettingsForm({ initialUser }: ProfileSettingsFormProps) {
  const router = useRouter();
  const { language } = useAppLanguage();
  const t = I18N[language].profile;
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(user.name ?? "");
  const [emoji, setEmoji] = useState(() => normalizeProfileEmoji(user.emoji));
  const [color, setColor] = useState(user.color || "#f43f5e");
  const [busy, setBusy] = useState(false);
  const [familyBusy, setFamilyBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [familyMembers, setFamilyMembers] = useState<
    { id: string; name: string | null; email: string | null; emoji: string; color: string; familyRole?: string }[]
  >([]);
  const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string }[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<
    { id: string; email: string; familyId: string; family: { name: string } }[]
  >([]);
  const [currentUserRole, setCurrentUserRole] = useState<"OWNER" | "MEMBER" | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteSuccessorId, setDeleteSuccessorId] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const successorCandidates = useMemo(
    () => familyMembers.filter((m) => m.id !== user.id),
    [familyMembers, user.id]
  );
  const needsSuccessorPick = currentUserRole === "OWNER" && successorCandidates.length > 0;

  useEffect(() => {
    setUser(initialUser);
    setName(initialUser.name ?? "");
    setEmoji(normalizeProfileEmoji(initialUser.emoji));
    setColor(initialUser.color || "#f43f5e");
  }, [initialUser]);

  useEffect(() => {
    setDeleteConfirmEmail("");
    setDeleteSuccessorId("");
    setDeleteError(null);
  }, [user.id]);

  const emojiPicker = useMemo(() => {
    const current = normalizeProfileEmoji(emoji);
    const seen = new Set<string>();
    const out: string[] = [];
    const add = (e: string) => {
      if (seen.has(e)) return;
      seen.add(e);
      out.push(e);
    };
    add(current);
    USER_EMOJIS.forEach(add);
    return out;
  }, [emoji]);

  const loadFamily = useCallback(async () => {
    setFamilyBusy(true);
    try {
      const res = await fetch("/api/family/members");
      if (!res.ok) return;
      const data = await res.json();
      setFamilyMembers(data.members || []);
      setPendingInvites(data.invitations || []);
      setIncomingInvites(data.incomingInvitations || []);
      setCurrentUserRole(data.currentUserRole || null);
    } finally {
      setFamilyBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadFamily();
  }, [user.id, loadFamily]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emoji, color }),
      });
      if (!res.ok) return;
      const next = (await res.json()) as UserProfile;
      setUser(next);
      router.refresh();
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
      const next = (await res.json()) as UserProfile;
      setUser(next);
      router.refresh();
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
    if (currentUserRole !== "MEMBER" && currentUserRole !== "OWNER") return;
    const ok = confirm(
      currentUserRole === "OWNER" ? t.leaveFamilyOwnerConfirm : t.leaveFamilyMemberConfirm
    );
    if (!ok) return;
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
      const next = (await meRes.json()) as UserProfile;
      setUser(next);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setFamilyBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!user.email?.trim()) return;
    if (!window.confirm(t.deleteAccountFinalConfirm)) return;
    const normalized = deleteConfirmEmail.trim().toLowerCase();
    if (normalized !== user.email.trim().toLowerCase()) {
      setDeleteError(t.deleteInvalidEmail);
      return;
    }
    if (needsSuccessorPick && !deleteSuccessorId) {
      setDeleteError(t.deleteNeedSuccessor);
      return;
    }
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmEmail: normalized,
          ...(needsSuccessorPick && deleteSuccessorId
            ? { transferOwnershipToUserId: deleteSuccessorId }
            : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (data.error === "NEED_SUCCESSOR") setDeleteError(t.deleteNeedSuccessor);
        else if (data.error === "INVALID_EMAIL") setDeleteError(t.deleteInvalidEmail);
        else setDeleteError(t.deleteAccountError);
        return;
      }
      await signOut({ redirect: false });
      window.location.href = "/login";
    } finally {
      setDeleteBusy(false);
    }
  };

  const acceptInvite = async (inviteId: string, familyName: string) => {
    const ok = confirm(t.acceptInviteConfirm.replace("{familyName}", familyName));
    if (!ok) return;
    setFamilyBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptInviteId: inviteId }),
      });
      if (!res.ok) return;
      const meRes = await fetch("/api/users/me");
      if (!meRes.ok) return;
      const next = (await meRes.json()) as UserProfile;
      setUser(next);
      window.location.reload();
    } finally {
      setFamilyBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-warm-800">{t.title}</h2>
        <p className="mt-1 text-sm text-warm-500">
          {user.email ? `${user.email}` : null}
        </p>
      </div>

      <div className="space-y-4 rounded-3xl border border-warm-100 bg-white/80 p-5">
        <h3 className="text-sm font-semibold text-warm-800">{t.personalSection}</h3>
        <div className="flex flex-wrap items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || t.userFallback}
              width={56}
              height={56}
              className="rounded-2xl object-cover"
              unoptimized={user.image.startsWith("/api/users/avatar/")}
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: color }}
            >
              <span className="select-none text-2xl leading-none">{normalizeProfileEmoji(emoji)}</span>
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-warm-50 px-3 py-2 text-sm text-warm-700 hover:bg-warm-100">
            <Upload size={14} className="text-warm-500" aria-hidden />
            {t.uploadPhoto}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-warm-500">{t.namePlaceholder}</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warm-800 outline-none focus:border-rose-300"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-warm-500">{t.iconLabel}</p>
          <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-2xl bg-warm-50 p-3">
            {emojiPicker.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg leading-none transition-colors ${
                  normalizeProfileEmoji(emoji) === e
                    ? "bg-white ring-2 ring-rose-300"
                    : "bg-white/60 hover:bg-white"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-warm-500">{t.colorLabel}</p>
          <div className="flex flex-wrap gap-2">
            {USER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full ${color === c ? "ring-2 ring-rose-400 ring-offset-2" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-xl bg-sage-500 px-4 py-2 text-sm text-white hover:bg-sage-600 disabled:opacity-60"
        >
          {t.save}
        </button>
      </div>

      <div className="space-y-4 rounded-3xl border border-warm-100 bg-white/80 p-5">
        <h3 className="text-sm font-semibold text-warm-800">{t.familyTitle}</h3>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {familyMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-warm-50 px-3 py-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-white"
                style={{ backgroundColor: m.color || "#f43f5e" }}
              >
                <span className="leading-none">{normalizeProfileEmoji(m.emoji)}</span>
              </div>
              <p className="text-sm font-medium text-warm-800">{m.name || m.email || t.memberFallback}</p>
            </div>
          ))}
          {pendingInvites.map((i) => (
            <p key={i.id} className="text-sm text-warm-400">
              {t.invitedLabel} {i.email}
            </p>
          ))}
          {incomingInvites.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 rounded-2xl bg-warm-50 px-3 py-2">
              <div>
                <p className="text-sm text-warm-700">
                  {t.inviteToLabel} {i.family.name}
                </p>
                <p className="text-xs text-warm-400">{i.email}</p>
              </div>
              <button
                type="button"
                disabled={familyBusy}
                onClick={() => acceptInvite(i.id, i.family.name)}
                className="rounded-lg bg-sage-500 px-3 py-1.5 text-xs text-white hover:bg-sage-600 disabled:opacity-60"
              >
                {t.accept}
              </button>
            </div>
          ))}
          {!familyBusy && familyMembers.length === 0 && (
            <p className="text-sm text-warm-400">{t.onlyYouInFamily}</p>
          )}
        </div>
        {currentUserRole === "OWNER" ? (
          <div className="flex gap-2">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t.inviteEmailPlaceholder}
              className="flex-1 rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warm-800 outline-none focus:border-rose-300"
            />
            <button
              type="button"
              disabled={familyBusy}
              onClick={() => void invite()}
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {t.add}
            </button>
          </div>
        ) : currentUserRole === "MEMBER" ? (
          <button
            type="button"
            disabled={familyBusy}
            onClick={() => void leaveFamily()}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {t.leaveFamily}
          </button>
        ) : (
          <div className="h-8 rounded-xl border border-warm-100 bg-warm-50" />
        )}
      </div>

      <div className="space-y-3 rounded-3xl border border-warm-100 bg-white/80 p-5">
        <h3 className="text-sm font-semibold text-warm-800">{t.deleteAccountSection}</h3>
        <p className="text-sm text-warm-500">{t.deleteAccountHint}</p>
        {needsSuccessorPick && (
          <>
            <p className="text-sm text-warm-500">{t.deleteOwnershipHint}</p>
            <div className="space-y-1">
              <p className="text-xs text-warm-500">{t.deleteSuccessorLabel}</p>
              <select
                value={deleteSuccessorId}
                onChange={(e) => setDeleteSuccessorId(e.target.value)}
                className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warm-800 outline-none focus:border-rose-300"
              >
                <option value="">{t.deleteSuccessorPlaceholder}</option>
                {successorCandidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email || t.memberFallback}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        {!user.email?.trim() ? (
          <p className="text-sm text-warm-400">{t.deleteNoEmail}</p>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs text-warm-500">{t.deleteConfirmEmailLabel}</p>
              <input
                type="email"
                autoComplete="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={t.deleteConfirmEmailPlaceholder}
                className="w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warm-800 outline-none focus:border-rose-300"
              />
            </div>
            {deleteError && <p className="text-sm text-rose-600">{deleteError}</p>}
            <button
              type="button"
              disabled={deleteBusy}
              onClick={() => void deleteAccount()}
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {deleteBusy ? t.deleteAccountBusy : t.deleteAccountButton}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
