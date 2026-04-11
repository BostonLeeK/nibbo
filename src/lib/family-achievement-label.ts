import type { AppLanguage } from "@/lib/i18n";
import { I18N } from "@/lib/i18n";

export function familyAchievementLabel(id: string, language: AppLanguage) {
  const badges = I18N[language].achievements.badges;
  if (id === "first-steps") return badges["first-steps"];
  if (id === "warm-routine") return badges["warm-routine"];
  if (id === "cozy-family") return badges["cozy-family"];
  if (id === "task-masters") return badges["task-masters"];
  if (id === "legend") return badges.legend;
  if (id === "master-of-nibbo") return badges["master-of-nibbo"];
  return id;
}
