import { useEffect, useMemo, useRef, useState } from "react";

function format(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

type TimerStatus = "idle" | "running" | "paused" | "done";

export function Timer({ durationMinutes }: { durationMinutes: number }) {
  const totalSeconds = useMemo(
    () => Math.max(1, Math.round(durationMinutes * 60)),
    [durationMinutes],
  );
  const [remaining, setRemaining] = useState(totalSeconds);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(totalSeconds);
    setStatus("idle");
  }, [totalSeconds]);

  useEffect(() => {
    if (status !== "running") return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setStatus("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status]);

  const progress = 1 - remaining / totalSeconds;

  return (
    <div className="card text-center">
      <div
        className="mx-auto flex h-40 w-40 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#2d6543 ${progress * 360}deg, #efe6d2 0deg)`,
        }}
        role="timer"
        aria-live="polite"
        aria-label={`${format(remaining)} remaining`}
      >
        <div className="flex h-[8.5rem] w-[8.5rem] flex-col items-center justify-center rounded-full bg-cream-50">
          <span className="text-4xl font-extrabold tabular-nums text-forest-900">
            {format(remaining)}
          </span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-bark-500">
            {status === "done"
              ? "Time is up"
              : status === "running"
                ? "In progress"
                : status === "paused"
                  ? "Paused"
                  : "Ready"}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {status === "idle" && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setStatus("running")}
          >
            Start
          </button>
        )}
        {status === "running" && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setStatus("paused")}
          >
            Pause
          </button>
        )}
        {status === "paused" && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setStatus("running")}
          >
            Resume
          </button>
        )}
        {status !== "idle" && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setRemaining(totalSeconds);
              setStatus("idle");
            }}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
