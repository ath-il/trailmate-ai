import type { AppStats, JournalEntry } from "../types";
import { addDays, fromDateKey, toDateKey } from "./date";

/** Returns the current consecutive-day streak ending today or yesterday. */
export function computeStreak(entries: JournalEntry[], now = new Date()): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((e) => e.date));

  const todayKey = toDateKey(now);
  let cursor: Date;
  if (days.has(todayKey)) {
    cursor = fromDateKey(todayKey);
  } else {
    const yesterdayKey = toDateKey(addDays(now, -1));
    if (!days.has(yesterdayKey)) return 0;
    cursor = fromDateKey(yesterdayKey);
  }

  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function computeBestStreak(entries: JournalEntry[]): number {
  const days = Array.from(new Set(entries.map((e) => e.date))).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of days) {
    const date = fromDateKey(key);
    if (prev && toDateKey(addDays(prev, 1)) === key) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

export function computeStats(entries: JournalEntry[], now = new Date()): AppStats {
  const totalPoints = entries.reduce((sum, e) => sum + e.points, 0);
  return {
    totalPoints,
    completedCount: entries.length,
    streak: computeStreak(entries, now),
    bestStreak: computeBestStreak(entries),
  };
}
