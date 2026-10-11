import type { Mission, MissionPrefs } from "../../types";
import { makeId } from "../id";

export function buildMissionPrompt(prefs: MissionPrefs): string {
  const activity =
    prefs.activity === "Surprise Me"
      ? "any outdoor activity you think fits best"
      : prefs.activity;

  return `Create ONE safe outdoor mission.
Time available: ${prefs.time} minutes.
Difficulty: ${prefs.difficulty}.
Environment: ${prefs.environment}.
Activity: ${activity}.

Rules:
- Free, realistic, no special equipment.
- Safe for a beginner.
- Between 3 and 5 short steps.
- "durationMinutes" MUST be ${prefs.time}.
- "difficulty" MUST be "${prefs.difficulty}".

Reply with ONLY this JSON object, no extra text:
{"title":"short title","description":"one sentence","steps":["step 1","step 2","step 3"],"durationMinutes":${prefs.time},"difficulty":"${prefs.difficulty}","checklist":["check 1","check 2","check 3"],"natureObservation":"one thing to notice","reflectionQuestion":"one question"}`;
}

/** Extracts the first balanced JSON object from a model response. */
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function cleanStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const out = value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
  return out.slice(0, max);
}

/**
 * Parses and validates a model response into a Mission.
 * Returns null if the response is unusable, so the caller can fall back.
 */
export function parseMissionResponse(
  raw: string,
  prefs: MissionPrefs,
): Mission | null {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) return null;

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return null;
  }

  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const description =
    typeof obj.description === "string" ? obj.description.trim() : "";
  const steps = cleanStringArray(obj.steps, 5).map((s) =>
    s.replace(/^\d+[).\s]+/, "").trim(),
  );
  const checklist = cleanStringArray(obj.checklist, 6);
  const natureObservation =
    typeof obj.natureObservation === "string"
      ? obj.natureObservation.trim()
      : "";
  const reflectionQuestion =
    typeof obj.reflectionQuestion === "string"
      ? obj.reflectionQuestion.trim()
      : "";

  // Require the essentials and at least 3 real steps.
  if (!title || !description || steps.length < 3) return null;
  if (!natureObservation || !reflectionQuestion) return null;

  const difficulty =
    obj.difficulty === "Easy" ||
    obj.difficulty === "Moderate" ||
    obj.difficulty === "Adventurous"
      ? obj.difficulty
      : prefs.difficulty;

  const mission: Mission = {
    id: makeId(),
    title,
    description,
    steps: steps.slice(0, 5),
    durationMinutes: prefs.time,
    difficulty,
    checklist:
      checklist.length >= 3
        ? checklist
        : steps.slice(0, Math.min(steps.length, 4)),
    natureObservation,
    reflectionQuestion,
    source: "ai",
    generatedAt: Date.now(),
  };
  return mission;
}
