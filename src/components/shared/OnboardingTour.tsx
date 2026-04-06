"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Joyride, STATUS, type EventData } from "react-joyride";

type OnboardingTourProps = {
  shouldRun: boolean;
  userId: string;
};

export default function OnboardingTour({ shouldRun, userId }: OnboardingTourProps) {
  const pathname = usePathname();
  const [run, setRun] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completedLocally, setCompletedLocally] = useState(false);
  const storageKey = useMemo(() => `nibbo:onboarding:${userId}`, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(storageKey) === "1") {
      setCompletedLocally(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!shouldRun || completedLocally || pathname !== "/dashboard") return;
    const id = window.setTimeout(() => setRun(true), 50);
    return () => window.clearTimeout(id);
  }, [shouldRun, completedLocally, pathname]);

  const steps = useMemo(
    () => [
      {
        target: "body",
        title: "Ласкаво просимо в Nibbo 🌙✨",
        content: "Nibbo потрібен, щоб уся сім'я тримала домашні справи в одному місці: задачі, календар, меню, нотатки, витрати й покупки — все синхронно, прозоро і без хаосу.",
        disableBeacon: true,
        placement: "center" as const,
      },
      {
        target: "[data-tour='dashboard-home']",
        title: "Головна сторінка",
        content: "Це твій домашній екран: прогрес, події, задачі та швидкі дії в одному місці.",
        disableBeacon: true,
        placement: "bottom" as const,
      },
      {
        target: "[data-tour='nav-family']",
        title: "Сім'я та учасники",
        content: "У розділі «Родина» є керування сім'єю, ролями та налаштуваннями учасників.",
        placement: "right" as const,
      },
      {
        target: "[data-tour='xp-badge']",
        title: "Досвід (XP)",
        content: "XP нараховується за виконані задачі. Чим більше закритих задач — тим вищий прогрес.",
        placement: "bottom" as const,
      },
      {
        target: "[data-tour='tamagotchi-3d']",
        title: "Ваш Nibbo",
        content: "Стан персонажа залежить від виконання задач: закриваєш більше задач — персонаж стає активнішим і сильнішим.",
        placement: "top" as const,
      },
      {
        target: "[data-tour='nav-menu']",
        title: "Рецепти",
        content: "Тут починається планування меню: додавай рецепти, страви і формуй покупки з інгредієнтів.",
        placement: "right" as const,
      },
      {
        target: "[data-tour='nav-calendar']",
        title: "Календар",
        content: "Потрібен, щоб планувати події та важливі дати для всієї сім'ї і не пропускати дедлайни.",
        placement: "right" as const,
      },
      {
        target: "[data-tour='nav-notes']",
        title: "Нотатки",
        content: "Зручно зберігати ідеї, списки та домашні замітки в категоріях, щоб усе було структуровано.",
        placement: "right" as const,
      },
      {
        target: "[data-tour='nav-budget']",
        title: "Витрати",
        content: "Допомагає контролювати витрати сім'ї, бачити куди йдуть гроші та тримати бюджет під контролем.",
        placement: "right" as const,
      },
    ],
    []
  );

  const markComplete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users/onboarding", { method: "POST" });
      if (!res.ok) {
        return;
      }
      setCompletedLocally(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, "1");
      }
    } catch {}
    setSaving(false);
  };

  const onEvent = async (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRun(false);
      await markComplete();
    }
  };

  if (pathname !== "/dashboard" || !shouldRun || completedLocally) return null;

  return (
    <Joyride
      run={run}
      steps={steps}
      onEvent={onEvent}
      continuous
      scrollToFirstStep
      options={{
        skipBeacon: true,
        buttons: ["back", "close", "primary", "skip"],
        zIndex: 120,
        primaryColor: "#f43f5e",
        textColor: "#6b3f2d",
        backgroundColor: "#ffffff",
      }}
      styles={{
        tooltip: {
          borderRadius: 18,
          padding: 16,
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 700,
          color: "#6b3f2d",
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.45,
          color: "#7b5a46",
        },
        buttonBack: {
          color: "#8b5e4a",
          fontSize: 13,
        },
        buttonSkip: {
          color: "#8b5e4a",
          fontSize: 13,
        },
        buttonPrimary: {
          backgroundColor: "#f43f5e",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          padding: "8px 12px",
        },
      }}
      locale={{
        back: "Назад",
        close: "Закрити",
        last: "Готово",
        next: "Далі",
        skip: "Пропустити",
      }}
    />
  );
}
