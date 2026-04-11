"use client";

import Link from "next/link";
import { I18N } from "@/lib/i18n";
import { useAppLanguage } from "@/hooks/useAppLanguage";

export function PrivacyContent() {
  const { language } = useAppLanguage();
  const t = I18N[language].legal;
  const nav = I18N[language].nav;
  const feedback = I18N[language].feedback;

  return (
    <div className="min-h-screen px-4 py-10 md:py-14">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="text-sm font-semibold text-rose-600 underline-offset-2 transition-colors hover:text-rose-700 hover:underline"
        >
          ← {nav.dashboard}
        </Link>
        <article className="mt-6 rounded-3xl border border-warm-100 bg-white/90 p-6 shadow-cozy md:p-8">
          <h1 className="font-heading text-2xl font-bold text-warm-800">{t.privacyHeading}</h1>
          <p className="mt-3 text-sm leading-relaxed text-warm-600 md:text-[15px]">{t.privacyLead}</p>
          <h2 className="mt-8 font-heading text-lg font-bold text-warm-800">{t.privacyCookiesTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600 md:text-[15px]">{t.privacyCookiesBody}</p>
          <h2 className="mt-8 font-heading text-lg font-bold text-warm-800">{t.privacyContactTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-warm-600 md:text-[15px]">{t.privacyContactBody}</p>
          <p className="mt-3">
            <Link
              href="/feedback"
              className="inline-flex items-center gap-1 font-semibold text-rose-600 underline-offset-2 hover:text-rose-700 hover:underline"
            >
              {feedback.pageTitle}
              <span aria-hidden>→</span>
            </Link>
          </p>
        </article>
      </div>
    </div>
  );
}
