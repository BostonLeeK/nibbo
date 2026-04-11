import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { auth } from "@/lib/auth";
import { APP_LANGUAGE_COOKIE_KEY, I18N } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = cookieStore.get(APP_LANGUAGE_COOKIE_KEY)?.value === "en" ? "en" : "uk";
  return { title: I18N[language].feedback.metaTitle };
}

export default async function FeedbackPage() {
  const session = await auth();
  const signedIn = Boolean(session?.user?.id);
  const initialEmail = session?.user?.email ?? "";
  return (
    <FeedbackForm
      initialContactEmail={initialEmail}
      backHref={signedIn ? "/dashboard" : "/login"}
      signedIn={signedIn}
    />
  );
}
