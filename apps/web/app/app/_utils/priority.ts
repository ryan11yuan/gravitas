// app/(app)/dashboard/_utils/priority.ts

export type Diff = "Easy" | "Medium" | "Hard";

export function daysUntil(dueISO?: string | null) {
  if (!dueISO) return Infinity;
  const now = Date.now();
  const t = new Date(dueISO).getTime();
  return Math.max(0, Math.ceil((t - now) / (1000 * 60 * 60 * 24)));
}

export function computePriorityScore(dueISO?: string | null, points?: number | null) {
  const d = daysUntil(dueISO);
  const p = points ?? 0;
  const dueComponent = d === 0 ? 100 : Math.min(100, 40 / (d || 0.5));
  const pointsComponent = Math.min(100, p * 2);
  return Math.round(dueComponent * 0.6 + pointsComponent * 0.4);
}

export function pickDifficultyFromScore(score: number): Diff {
  if (score >= 70) return "Hard";
  if (score > 50 && score < 70) return "Medium";
  return "Easy";
}
