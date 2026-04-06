"use client";

import { useCallback, useEffect, useState } from "react";
import { APP_LANGUAGE_KEY, type AppLanguage } from "@/lib/i18n";

const LANGUAGE_EVENT = "nibbo:language-change";

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  return value === "en" ? "en" : "uk";
}

export function useAppLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>("uk");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = normalizeLanguage(window.localStorage.getItem(APP_LANGUAGE_KEY));
    setLanguageState(next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== APP_LANGUAGE_KEY) return;
      const next = normalizeLanguage(event.newValue);
      setLanguageState(next);
      document.documentElement.lang = next;
    };
    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ language?: AppLanguage }>).detail;
      const next = normalizeLanguage(detail?.language);
      setLanguageState(next);
      document.documentElement.lang = next;
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LANGUAGE_EVENT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LANGUAGE_EVENT, onCustom as EventListener);
    };
  }, []);

  const setLanguage = useCallback((next: AppLanguage) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(APP_LANGUAGE_KEY, next);
    document.documentElement.lang = next;
    setLanguageState(next);
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { language: next } }));
  }, []);

  return { language, setLanguage };
}
