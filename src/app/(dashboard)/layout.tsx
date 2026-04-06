import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import OnboardingTour from "@/components/shared/OnboardingTour";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  let user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    color: string;
    emoji: string;
    onboardingCompletedAt: Date | null;
  } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        color: true,
        emoji: true,
        onboardingCompletedAt: true,
      },
    });
  } catch {
    const fallbackUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        color: true,
        emoji: true,
      },
    });
    if (fallbackUser) {
      user = { ...fallbackUser, onboardingCompletedAt: null };
    }
  }
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col md:overflow-hidden">
        <OnboardingTour shouldRun={!user.onboardingCompletedAt} userId={user.id} />
        <Header
          user={user}
          initialPoints={0}
          isAdmin={Boolean(session.user.isAdmin)}
        />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
