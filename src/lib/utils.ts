import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
  }).format(amount);
}

export const PRIORITY_CONFIG = {
  LOW: { label: "Низький", color: "bg-sage-100 text-sage-700", emoji: "🟢" },
  MEDIUM: { label: "Середній", color: "bg-sky-100 text-sky-700", emoji: "🔵" },
  HIGH: { label: "Високий", color: "bg-peach-100 text-peach-700", emoji: "🟠" },
  URGENT: { label: "Терміново", color: "bg-rose-100 text-rose-700", emoji: "🔴" },
} as const;

export const MEAL_TYPE_CONFIG = {
  BREAKFAST: { label: "Сніданок", emoji: "🌅", color: "bg-cream-100" },
  LUNCH: { label: "Обід", emoji: "☀️", color: "bg-peach-100" },
  DINNER: { label: "Вечеря", emoji: "🌙", color: "bg-lavender-100" },
  SNACK: { label: "Перекус", emoji: "🍎", color: "bg-sage-100" },
} as const;

export const USER_COLORS = [
  "#f43f5e", "#fb923c", "#facc15", "#4ade80",
  "#38bdf8", "#818cf8", "#c084fc", "#f472b6",
];

export const USER_EMOJIS = [
  "🌸", "🦋", "🌟", "🐱", "🦊", "🐰", "🐨", "🦄",
  "🌺", "🍀", "✨", "🌈", "🎀", "🍓", "🌙", "☀️",
];
