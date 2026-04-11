import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import ProfileSettingsForm from "@/components/shared/ProfileSettingsForm";
import { APP_LANGUAGE_COOKIE_KEY, I18N } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = cookieStore.get(APP_LANGUAGE_COOKIE_KEY)?.value === "en" ? "en" : "uk";
  return { title: I18N[language].profile.title };
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, color: true, emoji: true, familyId: true },
  });
  if (!user) redirect("/login");
  return <ProfileSettingsForm initialUser={user} />;
}
