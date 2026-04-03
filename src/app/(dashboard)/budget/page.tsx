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

  const [categories, expenses] = await Promise.all([
    prisma.expenseCategory.findMany({ where: { familyId }, orderBy: { name: "asc" } }),
    prisma.expense.findMany({
      where: { familyId, date: { gte: monthStart, lte: monthEnd } },
      include: {
        category: true,
        user: { select: { id: true, name: true, image: true, color: true, emoji: true } },
      },
      orderBy: { date: "desc" },
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

  return <BudgetView initialCategories={categories} initialExpenses={initialExpenses} currentUserId={session.user.id} />;
}
