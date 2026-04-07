import { auth } from "@/lib/auth";
import { getNbuExchangeRates } from "@/lib/exchange-rates";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import { SubscriptionBillingCycle } from "@prisma/client";
import BudgetView from "@/components/budget/BudgetView";

export default async function BudgetPage() {
  const session = await auth();
  if (!session) return null;
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [categories, expenses, incomes, subscriptions, exchangeRates, credits] = await Promise.all([
    prisma.expenseCategory.findMany({ where: { familyId }, orderBy: { name: "asc" } }),
    prisma.expense.findMany({
      where: { familyId, date: { gte: monthStart, lte: monthEnd } },
      include: {
        category: true,
        user: { select: { id: true, name: true, image: true, color: true, emoji: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.income.findMany({
      where: { familyId, date: { gte: monthStart, lte: monthEnd } },
      include: {
        user: { select: { id: true, name: true, image: true, color: true, emoji: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.familySubscription.findMany({
      where: {
        familyId,
        status: "ACTIVE",
      },
      select: {
        amount: true,
        currency: true,
        billingCycle: true,
      },
    }),
    getNbuExchangeRates(),
    prisma.credit.findMany({
      where: { familyId },
      orderBy: [{ status: "asc" }, { paymentDay: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const initialExpenses = expenses.map((e) => ({
    id: e.id,
    title: e.title,
    amount: e.amount,
    date: e.date.toISOString(),
    note: e.note,
    category: e.category,
    user: e.user,
  }));

  const initialIncomes = incomes.map((i) => ({
    id: i.id,
    title: i.title,
    amount: i.amount,
    date: i.date.toISOString(),
    note: i.note,
    user: i.user,
  }));

  const initialCredits = credits.map((c) => ({
    id: c.id,
    title: c.title,
    bank: c.bank,
    bankOtherName: c.bankOtherName,
    monthlyAmount: c.monthlyAmount,
    paymentDay: c.paymentDay,
    lastPaidAt: c.lastPaidAt ? c.lastPaidAt.toISOString() : null,
    status: c.status,
    note: c.note,
  }));

  const monthlyCreditsTotal = credits
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + c.monthlyAmount, 0);
  const monthlySubscriptionsTotal = subscriptions.reduce((sum, item) => {
    const monthlyAmount =
      item.billingCycle === SubscriptionBillingCycle.YEARLY ? item.amount / 12 : item.amount;
    const rate = exchangeRates[item.currency as keyof typeof exchangeRates] ?? 1;
    return sum + monthlyAmount * rate;
  }, 0);

  return (
    <BudgetView
      initialCategories={categories}
      initialExpenses={initialExpenses}
      initialIncomes={initialIncomes}
      initialCredits={initialCredits}
      monthlySubscriptionsTotal={monthlySubscriptionsTotal}
      monthlySubscriptionsCount={subscriptions.length}
      monthlyCreditsTotal={monthlyCreditsTotal}
      monthlyCreditsCount={credits.filter((c) => c.status === "ACTIVE").length}
      currentUserId={session.user.id}
    />
  );
}
