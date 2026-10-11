import { useRef, useState } from "react";
import { StatusBar } from "../components/StatusBar";
import { Spinner } from "../components/Spinner";
import { generateMission } from "../lib/generator";
import { useAI } from "../state/AIContext";
import { useApp } from "../state/AppContext";
import { useOnline } from "../state/online";
import {
  ACTIVITIES,
  DIFFICULTIES,
  ENVIRONMENTS,
  TIME_OPTIONS,
  type Activity,
  type Difficulty,
  type Environment,
  type TimeOption,
} from "../types";

function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onSelect,
  format,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={String(opt)}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(opt)}
              className={`chip ${active ? "chip-on" : "chip-off"}`}
            >
              {format ? format(opt) : String(opt)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function HomePage() {
  const { prefs, updatePrefs, stats, setActiveMission } = useApp();
  const { state, isReady, load, modelId, modelCached } = useAI();
  const online = useOnline();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const offlineKeys = useRef<Set<string>>(new Set());

  const aiHint =
    state.status === "unsupported"
      ? "Local AI is unavailable on this browser, so you will get bundled offline missions."
      : isReady
        ? "Local AI is ready. Missions will be generated on your device, offline."
        : "Local AI is not loaded yet. Preparing it needs an internet connection the first time to download the model; after that it runs fully offline. Until then you can still get a bundled offline mission.";

  async function onFindMission() {
    setBusy(true);
    setNotice(null);
    try {
      const result = await generateMission(prefs, {
        preferAI: isReady,
        excludeOfflineKeys: offlineKeys.current,
      });
      if (result.usedFallback) {
        const key = result.mission.title;
        offlineKeys.current.add(key);
      }
      if (result.note) setNotice(result.note);
      setActiveMission(result.mission);
    } catch (err) {
      setNotice(
        `Could not create a mission: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pb-28">
      <header className="flex items-start justify-between gap-3 pt-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600">
            TrailMate AI
          </p>
          <h1 className="mt-1 max-w-xs text-3xl font-extrabold leading-tight text-forest-900">
            Your next adventure starts outside.
          </h1>
        </div>
        <div className="mt-1 shrink-0 text-4xl" aria-hidden="true">
          🌲
        </div>
      </header>

      <StatusBar />

      {!online && modelCached === false && (
        <p
          role="status"
          className="rounded-2xl border border-sun/40 bg-sun/10 p-3 text-sm text-bark-700"
        >
          You are offline and the local AI model has not been downloaded yet.
          Bundled offline missions still work. Connect to the internet once to
          download the model, after which everything runs on your device.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-forest-800">
            {stats.totalPoints}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-bark-500">
            Nature points
          </p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-forest-800">
            {stats.streak}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-bark-500">
            Day streak
          </p>
        </div>
      </div>

      <section className="card space-y-5">
        <ChipGroup
          label="Available time"
          options={TIME_OPTIONS}
          value={prefs.time}
          onSelect={(v: TimeOption) => updatePrefs({ time: v })}
          format={(v) => `${v} min`}
        />
        <ChipGroup
          label="Difficulty"
          options={DIFFICULTIES}
          value={prefs.difficulty}
          onSelect={(v: Difficulty) => updatePrefs({ difficulty: v })}
        />
        <ChipGroup
          label="Environment"
          options={ENVIRONMENTS}
          value={prefs.environment}
          onSelect={(v: Environment) => updatePrefs({ environment: v })}
        />
        <ChipGroup
          label="Activity"
          options={ACTIVITIES}
          value={prefs.activity}
          onSelect={(v: Activity) => updatePrefs({ activity: v })}
        />
      </section>

      <button
        type="button"
        onClick={onFindMission}
        disabled={busy}
        className="btn-primary w-full text-lg"
      >
        {busy ? <Spinner /> : <span aria-hidden="true">🧭</span>}
        {busy ? "Finding your mission..." : "Find My Mission"}
      </button>

      {busy && (
        <p role="status" className="text-center text-sm text-forest-700">
          {state.status === "generating"
            ? "Thinking on your device..."
            : state.status === "loading"
              ? state.progressText || "Preparing local AI..."
              : "Preparing..."}
        </p>
      )}

      {notice && !busy && (
        <p className="rounded-2xl bg-cream-200 p-3 text-sm text-bark-700">
          {notice}
        </p>
      )}

      <section className="card space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Local AI status
        </h2>
        <p className="text-sm text-bark-600">{aiHint}</p>
        {state.error && (
          <p className="text-xs text-clay">{state.error}</p>
        )}
        {!isReady && state.status !== "unsupported" && (
          <button
            type="button"
            onClick={() => void load()}
            disabled={state.status === "loading"}
            className="btn-secondary w-full"
          >
            {state.status === "loading" && <Spinner />}
            {state.status === "loading"
              ? `Downloading model ${Math.round(state.progress * 100)}%`
              : state.status === "error"
                ? "Retry loading local AI"
                : "Prepare local AI"}
          </button>
        )}
        {state.status === "loading" && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-cream-300">
            <div
              className="h-full rounded-full bg-forest-600 transition-all"
              style={{ width: `${Math.round(state.progress * 100)}%` }}
            />
          </div>
        )}
        <p className="text-xs text-bark-400">
          Selected model: <span className="font-semibold">{modelId}</span>. Change
          it in Settings.
        </p>
      </section>

      <p className="px-2 text-center text-xs text-bark-400">
        Offline-first. Your entries and prompts never leave this device.
      </p>
    </div>
  );
}
