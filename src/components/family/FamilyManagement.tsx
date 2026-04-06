"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { I18N } from "@/lib/i18n";

type Member = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  color: string;
  emoji: string;
  familyRole: "OWNER" | "MEMBER";
  points: number;
};

type Invite = { id: string; email: string; createdAt: string };
type IncomingInvite = { id: string; email: string; createdAt: string; familyId: string; family: { name: string } };

type Payload = {
  family: { id: string; name: string; shareInLeaderboard: boolean } | null;
  members: Member[];
  invitations: Invite[];
  incomingInvitations: IncomingInvite[];
  currentUserRole: "OWNER" | "MEMBER";
  currentUserId: string;
};

export default function FamilyManagement() {
  const { language } = useAppLanguage();
  const t = I18N[language].family;
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [shareInLeaderboard, setShareInLeaderboard] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/family/members");
      if (!res.ok) throw new Error("fail");
      const payload = (await res.json()) as Payload;
      setData(payload);
      setFamilyName(payload.family?.name || "");
      setShareInLeaderboard(Boolean(payload.family?.shareInLeaderboard));
    } catch {
      toast.error(t.toastLoadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const invite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("fail");
      setInviteEmail("");
      toast.success(t.toastInviteSent);
      await load();
    } catch {
      toast.error(t.toastInviteError);
    } finally {
      setBusy(false);
    }
  };

  const removeInvite = async (inviteId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      if (!res.ok) throw new Error("fail");
      toast.success(t.toastInviteCancelled);
      await load();
    } catch {
      toast.error(t.toastCancelError);
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (memberId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) throw new Error("fail");
      toast.success(t.toastMemberRemoved);
      await load();
    } catch {
      toast.error(t.toastMemberRemoveError);
    } finally {
      setBusy(false);
    }
  };

  const acceptInvite = async (inviteId: string, familyName: string) => {
    const ok = confirm(t.acceptInviteConfirm.replace("{familyName}", familyName));
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptInviteId: inviteId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(data.error || "fail");
      }
      toast.success(t.toastInviteAccepted);
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.toastAcceptError);
    } finally {
      setBusy(false);
    }
  };

  const transferOwnership = async (ownerId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });
      if (!res.ok) throw new Error("fail");
      toast.success(t.toastOwnershipTransferred);
      await load();
    } catch {
      toast.error(t.toastOwnershipTransferError);
    } finally {
      setBusy(false);
    }
  };

  const owner = data?.currentUserRole === "OWNER";

  const saveFamilySettings = async () => {
    if (!familyName.trim()) {
      toast.error(t.toastFamilyNameRequired);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "settings",
          name: familyName.trim(),
          shareInLeaderboard,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(errorData.error || "fail");
      }
      toast.success(t.toastSettingsSaved);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.toastSaveError);
    } finally {
      setBusy(false);
    }
  };

  const leaveFamily = async () => {
    const ok = confirm(
      owner
        ? t.leaveFamilyOwnerConfirm
        : t.leaveFamilyMemberConfirm
    );
    if (!ok || !data) return;
    setBusy(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: data.currentUserId }),
      });
      if (!res.ok) throw new Error("fail");
      toast.success(t.toastLeftFamily);
      window.location.reload();
    } catch {
      toast.error(t.toastLeaveError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-warm-800">{t.title}</h2>
        <p className="text-sm text-warm-500 mt-1">
          {data?.family?.name || t.familyFallback} • {t.subtitle}
        </p>
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5 space-y-4">
        <h3 className="font-semibold text-warm-800 text-sm">{t.settingsTitle}</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-warm-500">{t.familyNameLabel}</p>
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder={t.familyNamePlaceholder}
              disabled={!owner || busy}
              className="w-full bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 border border-warm-200 outline-none focus:border-rose-300 disabled:opacity-60"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-warm-700">
            <input
              type="checkbox"
              checked={shareInLeaderboard}
              onChange={(e) => setShareInLeaderboard(e.target.checked)}
              disabled={!owner || busy}
              className="accent-rose-500"
            />
            {t.leaderboardShare}
          </label>
          <button
            type="button"
            disabled={!owner || busy}
            onClick={saveFamilySettings}
            className="px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm disabled:opacity-60"
          >
            {t.save}
          </button>
          {!owner && <p className="text-xs text-warm-400">{t.ownerOnlySettings}</p>}
        </div>
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5 space-y-4">
        <h3 className="font-semibold text-warm-800 text-sm">{t.inviteSectionTitle}</h3>
        <div className="flex gap-2">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email"
            className="flex-1 bg-warm-50 rounded-xl px-3 py-2 text-sm text-warm-800 border border-warm-200 outline-none focus:border-rose-300"
          />
          <button
            type="button"
            disabled={!owner || busy}
            onClick={invite}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm disabled:opacity-60"
          >
            {t.invite}
          </button>
        </div>
        {!owner && <p className="text-xs text-warm-400">{t.ownerOnlyInvite}</p>}
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5 space-y-3">
        <h3 className="font-semibold text-warm-800 text-sm">{t.membersTitle}</h3>
        {loading ? (
          <p className="text-sm text-warm-400">{t.loading}</p>
        ) : (
          (data?.members || []).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 bg-warm-50 rounded-2xl px-3 py-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white"
                  style={{ backgroundColor: m.color || "#f43f5e" }}
                >
                  {m.emoji || "🌸"}
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-800">{m.name || m.email || t.memberFallback}</p>
                  <p className="text-xs text-warm-400">
                    {m.familyRole === "OWNER" ? t.ownerRole : t.memberRole} • {t.personalXp}: {m.points}
                  </p>
                </div>
              </div>
              {owner && m.id !== data?.currentUserId && (
                <div className="flex gap-2">
                  {m.familyRole !== "OWNER" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => transferOwnership(m.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-lavender-500 hover:bg-lavender-600 text-white disabled:opacity-60"
                    >
                      {t.makeOwner}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeMember(m.id)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-warm-200 hover:bg-warm-300 text-warm-700 disabled:opacity-60"
                  >
                    {t.delete}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5 space-y-3">
        <h3 className="font-semibold text-warm-800 text-sm">{t.incomingInvitesTitle}</h3>
        {(data?.incomingInvitations || []).length === 0 ? (
          <p className="text-sm text-warm-400">{t.noIncomingInvites}</p>
        ) : (
          (data?.incomingInvitations || []).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between bg-warm-50 rounded-2xl px-3 py-2 gap-3">
              <div>
                <p className="text-sm text-warm-700">{inv.family.name}</p>
                <p className="text-xs text-warm-400">{inv.email}</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => acceptInvite(inv.id, inv.family.name)}
                className="px-3 py-1.5 text-xs rounded-lg bg-sage-500 hover:bg-sage-600 text-white disabled:opacity-60"
              >
                {t.accept}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5 space-y-3">
        <h3 className="font-semibold text-warm-800 text-sm">{t.pendingInvitesTitle}</h3>
        {(data?.invitations || []).length === 0 ? (
          <p className="text-sm text-warm-400">{t.noPendingInvites}</p>
        ) : (
          (data?.invitations || []).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between bg-warm-50 rounded-2xl px-3 py-2">
              <p className="text-sm text-warm-700">{inv.email}</p>
              {owner && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeInvite(inv.id)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-warm-200 hover:bg-warm-300 text-warm-700 disabled:opacity-60"
                >
                  {t.cancel}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-5">
        <button
          type="button"
          disabled={busy || !data}
          onClick={leaveFamily}
          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm disabled:opacity-60"
        >
          {t.leaveFamily}
        </button>
      </div>
    </div>
  );
}
