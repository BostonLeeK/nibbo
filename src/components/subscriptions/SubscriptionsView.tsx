"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Plus, Trash2, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { ExchangeRates } from "@/lib/exchange-rates";

type FamilyRole = "OWNER" | "MEMBER";
type BillingCycle = "MONTHLY" | "YEARLY";
type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";
type MemberRole = "USER" | "PAYER";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  color: string;
  emoji: string;
  familyRole?: FamilyRole;
};

type SubscriptionItem = {
  id: string;
  title: string;
  category: string | null;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  nextBillingDate: string;
  trialEndsAt: string | null;
  status: SubscriptionStatus;
  note: string | null;
  ownerUserId: string | null;
  ownerUser: User | null;
  members: Array<{ id: string; userId: string; role: MemberRole; user: User }>;
};

type FormState = {
  title: string;
  category: string;
  amount: string;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  trialEndsAt: string;
  status: SubscriptionStatus;
  note: string;
  ownerUserId: string;
  memberUserIds: string[];
  payerUserId: string;
};

const statusConfig: Record<SubscriptionStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Активна", className: "bg-sage-100 text-sage-700" },
  PAUSED: { label: "Пауза", className: "bg-amber-100 text-amber-700" },
  CANCELLED: { label: "Скасована", className: "bg-warm-200 text-warm-700" },
};

const subscriptionCategories = [
  "Відео та стримінг",
  "Музика",
  "Ігри",
  "Освіта",
  "Хмара та зберігання",
  "Продуктивність",
  "Безпека",
  "Здоров'я та спорт",
  "Транспорт",
  "Інше",
];

const currencyOptions = ["UAH", "USD", "EUR"];

function formatAmount(amount: number, currency: string) {
  const fixed = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  const [intPartRaw, decimalPart] = fixed.split(".");
  const sign = intPartRaw.startsWith("-") ? "-" : "";
  const intPart = sign ? intPartRaw.slice(1) : intPartRaw;
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const formattedNumber = `${sign}${grouped},${decimalPart}`;
  const suffix = currency === "UAH" ? "грн" : currency;
  return `${formattedNumber} ${suffix}`;
}

function toInputDate(date: string | Date | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthlyAmount(amount: number, billingCycle: BillingCycle) {
  return billingCycle === "YEARLY" ? amount / 12 : amount;
}

function toUah(amount: number, currency: string, exchangeRates: ExchangeRates) {
  const rate = exchangeRates[currency as keyof ExchangeRates] ?? 1;
  return amount * rate;
}

function toForm(item: SubscriptionItem): FormState {
  const memberUserIds = item.members.map((member) => member.userId);
  const payer = item.members.find((member) => member.role === "PAYER");
  return {
    title: item.title,
    category: item.category || "",
    amount: String(item.amount),
    currency: item.currency || "UAH",
    billingCycle: item.billingCycle,
    nextBillingDate: toInputDate(item.nextBillingDate),
    trialEndsAt: toInputDate(item.trialEndsAt),
    status: item.status,
    note: item.note || "",
    ownerUserId: item.ownerUserId || "",
    memberUserIds,
    payerUserId: payer?.userId || "",
  };
}

const emptyForm: FormState = {
  title: "",
  category: "",
  amount: "",
  currency: "UAH",
  billingCycle: "MONTHLY",
  nextBillingDate: toInputDate(new Date()),
  trialEndsAt: "",
  status: "ACTIVE",
  note: "",
  ownerUserId: "",
  memberUserIds: [],
  payerUserId: "",
};

export default function SubscriptionsView({
  initialItems,
  members,
  currentUserRole,
  exchangeRates,
}: {
  initialItems: SubscriptionItem[];
  members: User[];
  currentUserRole: FamilyRole;
  exchangeRates: ExchangeRates;
}) {
  const owner = currentUserRole === "OWNER";
  const [items, setItems] = useState(initialItems);
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | "ALL">("ALL");
  const [memberFilter, setMemberFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (memberFilter !== "ALL" && !item.members.some((member) => member.userId === memberFilter)) return false;
      return true;
    });
  }, [items, memberFilter, statusFilter]);

  const summary = useMemo(() => {
    const monthlyTotal = items.reduce((sum, item) => {
      if (item.status !== "ACTIVE") return sum;
      return sum + toUah(toMonthlyAmount(item.amount, item.billingCycle), item.currency, exchangeRates);
    }, 0);
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingCount = items.filter((item) => {
      if (item.status !== "ACTIVE") return false;
      const nextBillingDate = new Date(item.nextBillingDate);
      return nextBillingDate >= now && nextBillingDate <= in7Days;
    }).length;
    return {
      monthlyTotal,
      activeCount: items.filter((item) => item.status === "ACTIVE").length,
      upcomingCount,
    };
  }, [exchangeRates, items]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: SubscriptionItem) => {
    setEditingId(item.id);
    setForm(toForm(item));
    setShowModal(true);
  };

  const closeModal = () => {
    if (busy) return;
    setShowModal(false);
    setEditingId(null);
  };

  const toggleMember = (userId: string) => {
    setForm((prev) => {
      const exists = prev.memberUserIds.includes(userId);
      const nextMemberUserIds = exists
        ? prev.memberUserIds.filter((id) => id !== userId)
        : [...prev.memberUserIds, userId];
      const payerUserId = nextMemberUserIds.includes(prev.payerUserId) ? prev.payerUserId : "";
      return { ...prev, memberUserIds: nextMemberUserIds, payerUserId };
    });
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Вкажи назву сервісу");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Сума має бути більше 0");
      return;
    }
    if (!form.nextBillingDate) {
      toast.error("Вкажи дату наступного списання");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || null,
        amount,
        currency: form.currency.trim().toUpperCase() || "UAH",
        billingCycle: form.billingCycle,
        nextBillingDate: new Date(form.nextBillingDate).toISOString(),
        trialEndsAt: form.trialEndsAt ? new Date(form.trialEndsAt).toISOString() : null,
        status: form.status,
        note: form.note.trim() || null,
        ownerUserId: form.ownerUserId || null,
        memberUserIds: form.memberUserIds,
        payerUserId: form.payerUserId || null,
      };

      const url = editingId ? `/api/subscriptions/${editingId}` : "/api/subscriptions";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(err.error || "Не вдалося зберегти");
      }

      const data = (await res.json()) as SubscriptionItem;
      const normalized = {
        ...data,
        nextBillingDate: new Date(data.nextBillingDate).toISOString(),
        trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt).toISOString() : null,
      };
      setItems((prev) =>
        editingId ? prev.map((item) => (item.id === editingId ? normalized : item)) : [normalized, ...prev]
      );
      setShowModal(false);
      setEditingId(null);
      toast.success(editingId ? "Підписку оновлено" : "Підписку додано");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm("Видалити підписку?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(err.error || "Не вдалося видалити");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Підписку видалено");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-lavender-400 to-lavender-500 rounded-3xl p-5 text-white shadow-cozy">
        <p className="text-lavender-100 text-sm">Сімейні підписки</p>
        <h2 className="text-3xl font-bold mt-1">{formatAmount(summary.monthlyTotal, "UAH")} / міс</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
          <div className="bg-white/20 rounded-2xl px-4 py-2">
            <p className="text-xs text-lavender-100">Активні</p>
            <p className="font-bold">{summary.activeCount}</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2">
            <p className="text-xs text-lavender-100">Скоро списання</p>
            <p className="font-bold">{summary.upcomingCount}</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-2">
            <p className="text-xs text-lavender-100">Всього</p>
            <p className="font-bold">{items.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/80 rounded-3xl border border-warm-100 p-4 md:p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h3 className="font-semibold text-warm-800">Реєстр підписок</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | "ALL")}
              className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-700 outline-none"
            >
              <option value="ALL">Всі статуси</option>
              <option value="ACTIVE">Активні</option>
              <option value="PAUSED">На паузі</option>
              <option value="CANCELLED">Скасовані</option>
            </select>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-700 outline-none"
            >
              <option value="ALL">Всі учасники</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.emoji} {member.name || member.email || "Учасник"}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openCreate}
              disabled={!owner || busy}
              className="px-4 py-2 rounded-xl bg-lavender-500 hover:bg-lavender-600 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Plus size={15} />
              Додати
            </button>
          </div>
        </div>
        {!owner && <p className="text-xs text-warm-400">Тільки власник сім&apos;ї може змінювати підписки.</p>}

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl bg-warm-50 border border-warm-100 p-8 text-center text-warm-400">
            Підписок не знайдено
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const payer = item.members.find((member) => member.role === "PAYER")?.user;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-warm-100 bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-warm-500">{item.category || "Без категорії"}</p>
                      <h4 className="font-semibold text-warm-800">{item.title}</h4>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[item.status].className}`}>
                      {statusConfig[item.status].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-warm-50 border border-warm-100 px-3 py-2">
                      <p className="text-xs text-warm-500">Сума</p>
                      <p className="text-sm font-semibold text-warm-800">{formatAmount(item.amount, item.currency)}</p>
                      <p className="text-xs text-warm-400">{item.billingCycle === "MONTHLY" ? "Щомісяця" : "Щороку"}</p>
                    </div>
                    <div className="rounded-xl bg-warm-50 border border-warm-100 px-3 py-2">
                      <p className="text-xs text-warm-500">Наступне списання</p>
                      <p className="text-sm font-semibold text-warm-800">{new Date(item.nextBillingDate).toLocaleDateString("uk-UA")}</p>
                      {item.trialEndsAt && (
                        <p className="text-xs text-warm-400">Тріал до {new Date(item.trialEndsAt).toLocaleDateString("uk-UA")}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-warm-500">Користувачі</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.members.length === 0 && <span className="text-xs text-warm-400">Нікого не призначено</span>}
                      {item.members.map((member) => (
                        <span key={member.id} className="text-xs px-2 py-1 rounded-full bg-warm-100 text-warm-700">
                          {member.user.emoji} {member.user.name || member.user.email || "Учасник"}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-warm-500">
                      Платник: {payer ? `${payer.emoji} ${payer.name || payer.email || "Учасник"}` : "не вказано"}
                    </p>
                  </div>

                  {item.note && <p className="text-sm text-warm-600">{item.note}</p>}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={!owner || busy}
                      onClick={() => openEdit(item)}
                      className="px-3 py-1.5 rounded-lg bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs font-medium disabled:opacity-60"
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      disabled={!owner || busy}
                      onClick={() => removeItem(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-medium disabled:opacity-60 flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      Видалити
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeModal}
                  className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 14 }}
                  className="relative z-10 w-full max-w-2xl max-h-[92vh] rounded-3xl bg-white shadow-cozy-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-warm-100 px-5 py-4">
                    <h3 className="font-bold text-warm-800">{editingId ? "Редагувати підписку" : "Нова підписка"}</h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-8 h-8 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-500 flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Назва сервісу"
                        className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                      />
                      <select
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                      >
                        <option value="">Без категорії</option>
                        {subscriptionCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <input
                        value={form.amount}
                        onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Сума"
                        className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                      />
                      <select
                        value={form.currency}
                        onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                        className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                      >
                        {currencyOptions.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                      <select
                        value={form.billingCycle}
                        onChange={(e) => setForm((prev) => ({ ...prev, billingCycle: e.target.value as BillingCycle }))}
                        className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                      >
                        <option value="MONTHLY">Щомісяця</option>
                        <option value="YEARLY">Щороку</option>
                      </select>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as SubscriptionStatus }))}
                        className="bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                      >
                        <option value="ACTIVE">Активна</option>
                        <option value="PAUSED">Пауза</option>
                        <option value="CANCELLED">Скасована</option>
                      </select>
                      <label className="text-xs text-warm-500 space-y-1">
                        <span className="flex items-center gap-1">
                          <CalendarClock size={13} />
                          Наступне списання
                        </span>
                        <input
                          type="date"
                          value={form.nextBillingDate}
                          onChange={(e) => setForm((prev) => ({ ...prev, nextBillingDate: e.target.value }))}
                          className="w-full bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                        />
                      </label>
                      <label className="text-xs text-warm-500 space-y-1">
                        <span>Кінець тріалу</span>
                        <input
                          type="date"
                          value={form.trialEndsAt}
                          onChange={(e) => setForm((prev) => ({ ...prev, trialEndsAt: e.target.value }))}
                          className="w-full bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                        />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-warm-500 flex items-center gap-1">
                        <UserRound size={13} />
                        Відповідальний
                      </p>
                      <select
                        value={form.ownerUserId}
                        onChange={(e) => setForm((prev) => ({ ...prev, ownerUserId: e.target.value }))}
                        className="w-full bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                      >
                        <option value="">Не вказано</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.emoji} {member.name || member.email || "Учасник"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-warm-500">Хто користується</p>
                      <div className="flex flex-wrap gap-2">
                        {members.map((member) => {
                          const selected = form.memberUserIds.includes(member.id);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => toggleMember(member.id)}
                              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                selected
                                  ? "bg-lavender-100 border-lavender-300 text-lavender-700"
                                  : "bg-white border-warm-200 text-warm-600 hover:bg-warm-50"
                              }`}
                            >
                              {member.emoji} {member.name || member.email || "Учасник"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-warm-500">Платник</p>
                      <select
                        value={form.payerUserId}
                        onChange={(e) => setForm((prev) => ({ ...prev, payerUserId: e.target.value }))}
                        className="w-full bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none"
                      >
                        <option value="">Не вказано</option>
                        {members
                          .filter((member) => form.memberUserIds.includes(member.id))
                          .map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.emoji} {member.name || member.email || "Учасник"}
                            </option>
                          ))}
                      </select>
                    </div>

                    <textarea
                      value={form.note}
                      onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                      rows={3}
                      placeholder="Нотатка"
                      className="w-full bg-warm-50 border border-warm-200 rounded-xl px-3 py-2 text-sm text-warm-800 outline-none resize-none"
                    />
                  </div>
                  <div className="border-t border-warm-100 p-4 flex gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl bg-white border border-warm-200 text-warm-700 text-sm font-medium"
                    >
                      Скасувати
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={save}
                      className="flex-1 py-2.5 rounded-xl bg-lavender-500 hover:bg-lavender-600 text-white text-sm font-medium disabled:opacity-60"
                    >
                      {editingId ? "Зберегти" : "Створити"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
