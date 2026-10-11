import {
  ACTIVITIES,
  DIFFICULTIES,
  ENVIRONMENTS,
  TIME_OPTIONS,
  type Activity,
  type Difficulty,
  type Environment,
  type MissionPrefs,
  type TimeOption,
} from "../types";

const PREFS_KEY = "trailmate.prefs.v1";
const MODEL_KEY = "trailmate.model.v1";

export const DEFAULT_PREFS: MissionPrefs = {
  time: 15,
  difficulty: "Easy",
  environment: "Park",
  activity: "Nature Observation",
};

function isTime(v: unknown): v is TimeOption {
  return TIME_OPTIONS.includes(v as TimeOption);
}
function isDifficulty(v: unknown): v is Difficulty {
  return DIFFICULTIES.includes(v as Difficulty);
}
function isEnvironment(v: unknown): v is Environment {
  return ENVIRONMENTS.includes(v as Environment);
}
function isActivity(v: unknown): v is Activity {
  return ACTIVITIES.includes(v as Activity);
}

export function loadPrefs(): MissionPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<MissionPrefs>;
    return {
      time: isTime(parsed.time) ? parsed.time : DEFAULT_PREFS.time,
      difficulty: isDifficulty(parsed.difficulty)
        ? parsed.difficulty
        : DEFAULT_PREFS.difficulty,
      environment: isEnvironment(parsed.environment)
        ? parsed.environment
        : DEFAULT_PREFS.environment,
      activity: isActivity(parsed.activity)
        ? parsed.activity
        : DEFAULT_PREFS.activity,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: MissionPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage may be unavailable (private mode); ignore */
  }
}

export function loadModelId(fallback: string): string {
  try {
    return localStorage.getItem(MODEL_KEY) || fallback;
  } catch {
    return fallback;
  }
}

export function saveModelId(modelId: string): void {
  try {
    localStorage.setItem(MODEL_KEY, modelId);
  } catch {
    /* ignore */
  }
}
