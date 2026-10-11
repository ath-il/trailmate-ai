import type { Mission, MissionPrefs } from "../types";
import { localAI } from "./ai/engine";
import { buildMissionPrompt, parseMissionResponse } from "./ai/prompt";
import { pickOfflineMission } from "./fallbackMissions";

export interface GenerationResult {
  mission: Mission;
  usedFallback: boolean;
  /** Why the AI path was not used, when applicable. */
  note?: string;
}

/**
 * Generates a mission using local AI when available, and bundled offline
 * missions otherwise. Fallback missions are labelled `source: "offline"` and
 * the UI never claims they were AI generated.
 */
export async function generateMission(
  prefs: MissionPrefs,
  options: {
    preferAI: boolean;
    excludeOfflineKeys?: Set<string>;
    onToken?: (partial: string) => void;
  },
): Promise<GenerationResult> {
  const { preferAI, excludeOfflineKeys, onToken } = options;
  const prompt = buildMissionPrompt(prefs);

  if (preferAI && localAI.isReady()) {
    try {
      const raw = await localAI.generate(prompt, onToken);
      const parsed = parseMissionResponse(raw, prefs);
      if (parsed) {
        return { mission: parsed, usedFallback: false };
      }
      // One retry with a stronger instruction before giving up.
      const retry = await localAI.generate(
        `${prompt}\n\nReturn ONLY the JSON object. No explanation, no markdown fences.`,
        onToken,
      );
      const parsedRetry = parseMissionResponse(retry, prefs);
      if (parsedRetry) {
        return { mission: parsedRetry, usedFallback: false };
      }
      const offline = pickOfflineMission(prefs, excludeOfflineKeys);
      return {
        mission: offline.mission,
        usedFallback: true,
        note: "The local model returned text we could not read as a mission, so a bundled offline mission was used.",
      };
    } catch (err) {
      const offline = pickOfflineMission(prefs, excludeOfflineKeys);
      return {
        mission: offline.mission,
        usedFallback: true,
        note: `Local AI failed (${
          err instanceof Error ? err.message : String(err)
        }). A bundled offline mission was used instead.`,
      };
    }
  }

  const offline = pickOfflineMission(prefs, excludeOfflineKeys);
  return {
    mission: offline.mission,
    usedFallback: true,
    note: preferAI
      ? "Local AI is not ready yet, so a bundled offline mission was used."
      : "Offline mission (local AI was not requested).",
  };
}
