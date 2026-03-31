import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MealPlanner from "@/components/menu/MealPlanner";

export default async function MenuPage() {
  const session = await auth();
  if (!session) return null;

  const [recipes, users] = await Promise.all([
    prisma.recipe.findMany({
      include: { ingredients: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, image: true, color: true, emoji: true } }),
  ]);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const mealPlans = await prisma.mealPlan.findMany({
    where: { date: { gte: weekStart, lte: weekEnd } },
    include: {
      recipe: { include: { ingredients: true } },
      cook: { select: { id: true, name: true, image: true, color: true, emoji: true } },
    },
  });

  const initialMealPlans = mealPlans.map((m) => ({ ...m, date: m.date.toISOString() }));

  return (
    <MealPlanner
      initialRecipes={recipes}
      initialMealPlans={initialMealPlans}
      users={users}
      currentUserId={session.user.id}
    />
  );
}
