import { StatusBar } from "../components/StatusBar";
import { formatDate, formatTime } from "../lib/date";
import { useApp } from "../state/AppContext";

export function JournalPage() {
  const { entries, stats, entriesLoaded, removeEntry } = useApp();

  return (
    <div className="space-y-5 pb-28">
      <header className="pt-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600">
          Nature journal
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-forest-900">
          Your outdoor story
        </h1>
      </header>

      <StatusBar />

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-forest-800">
            {stats.totalPoints}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-bark-500">
            Points
          </p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-forest-800">{stats.streak}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-bark-500">
            Streak
          </p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-extrabold text-forest-800">
            {stats.bestStreak}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-bark-500">
            Best
          </p>
        </div>
      </div>

      {!entriesLoaded && (
        <p className="text-center text-sm text-bark-500">Loading your journal...</p>
      )}

      {entriesLoaded && entries.length === 0 && (
        <div className="card text-center">
          <p className="text-4xl" aria-hidden="true">
            🌱
          </p>
          <p className="mt-2 font-semibold text-forest-900">
            No missions completed yet
          </p>
          <p className="text-sm text-bark-600">
            Finish a mission and it will appear here, saved on this device.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="card animate-fade-up space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-forest-900">
                  {entry.mission.title}
                </h2>
                <p className="text-xs text-bark-500">
                  {formatDate(entry.completedAt)} · {formatTime(entry.completedAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-forest-100 px-2.5 py-1 text-xs font-bold text-forest-800">
                +{entry.points}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-bark-500">
              <span className="rounded-full bg-cream-200 px-2 py-0.5">
                {entry.mission.durationMinutes} min
              </span>
              <span className="rounded-full bg-cream-200 px-2 py-0.5">
                {entry.mission.difficulty}
              </span>
              <span className="rounded-full bg-cream-200 px-2 py-0.5">
                {entry.mission.source === "ai" ? "AI" : "Offline"}
              </span>
            </div>
            {entry.reflection && (
              <p className="whitespace-pre-wrap rounded-2xl bg-cream-100 p-3 text-sm text-forest-900">
                {entry.reflection}
              </p>
            )}
            <button
              type="button"
              onClick={() => void removeEntry(entry.id)}
              className="text-xs font-semibold text-clay hover:underline"
            >
              Delete entry
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
