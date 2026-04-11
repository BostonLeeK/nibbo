"use client";

import { useAppLanguage } from "@/hooks/useAppLanguage";
import { I18N } from "@/lib/i18n";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Cookie,
  CreditCard,
  NotebookPen,
  ShoppingCart,
  SquareKanban,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CONSENT_KEY = "nibbo:cookie-consent";
const CONSENT_VALUE = "v2";

const COOKIE_BANNER_DECOR_ICONS = [
  SquareKanban,
  CalendarDays,
  UtensilsCrossed,
  NotebookPen,
  Cookie,
  ShoppingCart,
  CreditCard,
] as const;

const cookieBannerDecorItems = Array.from({ length: 18 }, (_, index) => {
  const Icon =
    COOKIE_BANNER_DECOR_ICONS[index % COOKIE_BANNER_DECOR_ICONS.length];
  const left = 1 + (index % 9) * 11 + ((index * 5) % 6);
  const top = -8 + Math.floor(index / 9) * 48 + ((index * 7) % 14);
  const size = 16 + (index % 4) * 5;
  const opacity = 0.055 + (index % 4) * 0.02;
  const duration = 4.2 + (index % 5) * 0.55;
  const delay = (index % 8) * 0.18;
  const rotate = (index % 2 === 0 ? 1 : -1) * (5 + (index % 3) * 4);
  return { Icon, left, top, size, opacity, duration, delay, rotate };
});

export function CookieConsent() {
  const pathname = usePathname();
  const { language } = useAppLanguage();
  const t = I18N[language].legal;
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(CONSENT_KEY)
          : null;
      if (stored === CONSENT_VALUE) {
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
  if (pathname === "/privacy" || pathname?.startsWith("/privacy/")) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-live="polite"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
          className="fixed inset-x-0 bottom-0 z-[9980] flex justify-center pointer-events-none md:px-4 md:pb-4"
        >
          <div className="pointer-events-auto relative w-full max-w-3xl overflow-hidden rounded-t-3xl border-x border-t border-rose-200/90 bg-gradient-to-br from-cream-50 via-white to-lavender-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_40px_rgba(244,63,94,0.12)] sm:px-5 sm:pt-5 md:rounded-3xl md:border md:shadow-cozy-lg">
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-3xl md:rounded-3xl"
              aria-hidden
            >
              {cookieBannerDecorItems.map((item, i) => (
                <motion.div
                  key={i}
                  className="absolute text-rose-300 select-none"
                  style={{
                    left: `${item.left}%`,
                    top: `${item.top}%`,
                    opacity: item.opacity,
                  }}
                  animate={{
                    y: [0, -10, 0],
                    rotate: [-item.rotate, item.rotate, -item.rotate],
                    scale: [1, 1.05, 1],
                    opacity: [item.opacity, item.opacity + 0.04, item.opacity],
                  }}
                  transition={{
                    duration: item.duration,
                    repeat: Infinity,
                    delay: item.delay,
                    ease: "easeInOut",
                  }}
                >
                  <item.Icon size={item.size} strokeWidth={1.25} />
                </motion.div>
              ))}
            </div>
            <div className="relative z-10 flex gap-3 md:gap-4">
              <div
                className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 via-rose-50 to-lavender-100 text-rose-500 sm:flex"
                aria-hidden
              >
                <Cookie size={26} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="cookie-consent-title"
                  className="font-heading text-base font-bold text-warm-800 md:text-lg"
                >
                  {t.cookieTitle}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-warm-600 md:text-[15px]">
                  {t.cookieText}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-warm-500 md:text-[13px]">
                  {t.cookieAckBeforeLink}{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-rose-600 underline-offset-2 hover:underline"
                  >
                    {t.cookieAckLinkLabel}
                  </Link>{" "}
                  {t.cookieAckAfterLink}
                </p>
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
