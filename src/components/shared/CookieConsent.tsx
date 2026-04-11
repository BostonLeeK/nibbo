"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { I18N } from "@/lib/i18n";
import { useAppLanguage } from "@/hooks/useAppLanguage";

const CONSENT_KEY = "nibbo:cookie-consent";
const CONSENT_VALUE = "v1";

export function CookieConsent() {
  const { language } = useAppLanguage();
  const t = I18N[language].legal;
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof localStorage !== "undefined" && localStorage.getItem(CONSENT_KEY) === CONSENT_VALUE) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, CONSENT_VALUE);
    } catch {}
    setVisible(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-live="polite"
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="fixed bottom-0 left-0 right-0 z-[9980] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-5 pointer-events-none"
        >
          <div className="pointer-events-auto w-full max-w-lg rounded-3xl border border-rose-200/90 bg-white/95 px-4 py-4 shadow-cozy-lg backdrop-blur-md md:px-6 md:py-5">
            <div className="flex gap-3 md:gap-4">
              <div
                className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 via-rose-50 to-lavender-100 text-rose-500 sm:flex"
                aria-hidden
              >
                <Cookie size={26} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="cookie-consent-title" className="font-heading text-base font-bold text-warm-800 md:text-lg">
                  {t.cookieTitle}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-warm-600 md:text-[15px]">{t.cookieText}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={accept}
                    className="rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform active:scale-[0.98] hover:opacity-95"
                  >
                    {t.cookieAccept}
                  </button>
                  <Link
                    href="/privacy"
                    className="rounded-2xl px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    {t.cookieLearnMore}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
