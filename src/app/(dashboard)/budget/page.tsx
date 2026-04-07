import { auth } from "@/lib/auth";
import { ensureUserFamily } from "@/lib/family";
import { prisma } from "@/lib/prisma";
import BudgetView from "@/components/budget/BudgetView";

export default async function BudgetPage() {
  const session = await auth();
  if (!session) return null;
  const familyId = await ensureUserFamily(session.user.id);
  if (!familyId) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [categories, expenses, incomes, subscriptionStats] = await Promise.all([
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
    prisma.familySubscription.aggregate({
      where: {
        familyId,
        status: "ACTIVE",
        nextBillingDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
      _count: { _all: true },
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

  return (
    <BudgetView
      initialCategories={categories}
      initialExpenses={initialExpenses}
      initialIncomes={initialIncomes}
      monthlySubscriptionsTotal={subscriptionStats._sum.amount ?? 0}
      monthlySubscriptionsCount={subscriptionStats._count._all}
      currentUserId={session.user.id}
    />
  );
}
