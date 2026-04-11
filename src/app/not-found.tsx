import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NotFoundContent } from "@/components/shared/NotFoundContent";
import { APP_LANGUAGE_COOKIE_KEY, I18N } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = cookieStore.get(APP_LANGUAGE_COOKIE_KEY)?.value === "en" ? "en" : "uk";
  return { title: I18N[language].notFound.metaTitle };
}

export default function NotFound() {
  return <NotFoundContent />;
}
