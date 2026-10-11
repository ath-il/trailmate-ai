import { useEffect, useMemo, useState } from "react";
import { Timer } from "../components/Timer";
import { getEntryByMission } from "../lib/db";
import { useApp } from "../state/AppContext";
import { POINTS_PER_MISSION, type Mission } from "../types";

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 2,
        color: ["#2d6543", "#e9b44c", "#c06b3e", "#8dbd99", "#8a6a4f"][i % 5],
        size: 7 + Math.random() * 8,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block animate-fall rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function MissionPage({
  mission,
  onExit,
}: {
  mission: Mission;
  onExit: () => void;
}) {
  const { completeMission, entries } = useApp();
  const [checked, setChecked] = useState<boolean[]>(() =>
    mission.checklist.map(() => false),
  );
  const [phase, setPhase] = useState<"active" | "celebrate">("active");
  const [reflection, setReflection] = useState("");
  const [awarded, setAwarded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    let alive = true;
    void getEntryByMission(mission.id).then((entry) => {
      if (alive) setAlreadyDone(Boolean(entry));
    });
    return () => {
      alive = false;
    };
  }, [mission.id]);

  // Keep in sync if a completion for this mission already exists in the store.
  useEffect(() => {
    if (entries.some((e) => e.missionId === mission.id)) setAlreadyDone(true);
  }, [entries, mission.id]);

  const checkedCount = checked.filter(Boolean).length;

  async function handleComplete() {
    setSaving(true);
    try {
      const outcome = await completeMission(mission, reflection);
      setAwarded(outcome.awarded);
      setPhase("celebrate");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "celebrate") {
    return (
      <div className="relative space-y-5 pb-28 animate-fade-up">
        <Confetti />
        <div className="card relative z-50 mt-6 space-y-4 text-center">
          <div className="text-6xl animate-float" aria-hidden="true">
            🎉
          </div>
          <h1 className="text-2xl font-extrabold text-forest-900">
            Mission complete!
          </h1>
          <p className="text-bark-600">
            {awarded
              ? `You earned ${POINTS_PER_MISSION} nature points.`
              : "You already earned points for this mission, so no extra points were added."}
          </p>
          {reflection.trim() && (
            <div className="rounded-2xl bg-cream-200 p-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-bark-500">
                Your reflection
              </p>
              <p className="mt-1 whitespace-pre-wrap text-forest-900">
                {reflection.trim()}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button type="button" className="btn-primary w-full" onClick={onExit}>
              Back to missions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28 animate-fade-up">
      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost px-3 py-2" onClick={onExit}>
          ← Back
        </button>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            mission.source === "ai"
              ? "bg-forest-700 text-cream-50"
              : "bg-bark-500 text-cream-50"
          }`}
        >
          {mission.source === "ai" ? "AI generated" : "Offline mission"}
        </span>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold text-forest-900">
          {mission.title}
        </h1>
        <p className="text-bark-600">{mission.description}</p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-forest-100 px-3 py-1 text-forest-800">
            {mission.durationMinutes} min
          </span>
          <span className="rounded-full bg-cream-300 px-3 py-1 text-bark-700">
            {mission.difficulty}
          </span>
        </div>
      </header>

      <section className="card space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Steps
        </h2>
        <ol className="space-y-2">
          {mission.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-700 text-xs font-bold text-cream-50">
                {i + 1}
              </span>
              <span className="text-forest-900">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card space-y-1 border-l-4 border-l-sun">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Nature observation
        </h2>
        <p className="text-forest-900">{mission.natureObservation}</p>
      </section>

      <Timer durationMinutes={mission.durationMinutes} />

      <section className="card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Checklist ({checkedCount}/{mission.checklist.length})
        </h2>
        <ul className="space-y-2">
          {mission.checklist.map((item, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-cream-200">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() =>
                    setChecked((prev) =>
                      prev.map((v, idx) => (idx === i ? !v : v)),
                    )
                  }
                  className="h-5 w-5 accent-forest-700"
                />
                <span
                  className={checked[i] ? "text-bark-400 line-through" : "text-forest-900"}
                >
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-2">
        <label htmlFor="reflection" className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Reflection
        </label>
        <p className="text-sm text-bark-600">{mission.reflectionQuestion}</p>
        <textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={3}
          placeholder="Optional: jot down what you noticed..."
          className="w-full rounded-2xl border border-forest-200 bg-cream-50 p-3 text-forest-900 placeholder:text-bark-400"
        />
      </section>

      {alreadyDone && (
        <p className="rounded-2xl bg-cream-200 p-3 text-sm text-bark-700">
          You have already completed this mission. Completing again will not add
          points, but your new reflection will be saved only if it is a new
          mission.
        </p>
      )}

      <button
        type="button"
        className="btn-primary w-full text-lg"
        onClick={() => void handleComplete()}
        disabled={saving}
      >
        {saving ? "Saving..." : "Complete Mission"}
      </button>
    </div>
  );
}
