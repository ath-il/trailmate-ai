export const TIME_OPTIONS = [5, 15, 30, 60] as const;
export type TimeOption = (typeof TIME_OPTIONS)[number];

export const DIFFICULTIES = ["Easy", "Moderate", "Adventurous"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ENVIRONMENTS = [
  "Garden",
  "Park",
  "Neighborhood",
  "Anywhere safe",
] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const ACTIVITIES = [
  "Walking",
  "Nature Observation",
  "Gardening",
  "Surprise Me",
] as const;
export type Activity = (typeof ACTIVITIES)[number];

export interface MissionPrefs {
  time: TimeOption;
  difficulty: Difficulty;
  environment: Environment;
  activity: Activity;
}

export type MissionSource = "ai" | "offline";

export interface Mission {
  /** Stable unique id for this generated mission instance. */
  id: string;
  title: string;
  description: string;
  /** 3 to 5 practical steps. */
  steps: string[];
  durationMinutes: number;
  difficulty: Difficulty;
  /** Practical checklist items shown next to the timer. */
  checklist: string[];
  /** A nature observation challenge. */
  natureObservation: string;
  /** A reflection question to answer on completion. */
  reflectionQuestion: string;
  /** Whether this came from local AI or from bundled offline missions. */
  source: MissionSource;
  generatedAt: number;
}

export interface JournalEntry {
  id: string;
  missionId: string;
  mission: Mission;
  completedAt: number;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  reflection: string;
  points: number;
}

export interface AppStats {
  totalPoints: number;
  completedCount: number;
  streak: number;
  /** Longest streak ever recorded, in days. */
  bestStreak: number;
}

export const POINTS_PER_MISSION = 10;
