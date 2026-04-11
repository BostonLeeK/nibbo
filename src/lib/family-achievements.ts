import { POINTS_PER_TASK_COMPLETION } from "@/lib/task-points";

export const FAMILY_ACHIEVEMENT_THRESHOLDS = [
  { id: "first-steps", threshold: 50 },
  { id: "warm-routine", threshold: 300 },
  { id: "cozy-family", threshold: 600 },
  { id: "task-masters", threshold: 1200 },
  { id: "legend", threshold: 2500 },
  { id: "master-of-nibbo", threshold: 5000 },
] as const;

export function familyXpFromCompletedTaskCount(completed: number) {
  return completed * POINTS_PER_TASK_COMPLETION;
}

export function unlockedFamilyAchievementIds(xp: number) {
  return FAMILY_ACHIEVEMENT_THRESHOLDS.filter((a) => xp >= a.threshold).map((a) => a.id);
}
