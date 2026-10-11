import { useAI } from "../state/AIContext";
import { useOnline } from "../state/online";

function Dot({ className }: { className: string }) {
  return <span className={`h-2 w-2 rounded-full ${className}`} aria-hidden="true" />;
}

export function StatusBar() {
  const online = useOnline();
  const { state, isReady } = useAI();

  const aiLabel =
    state.status === "unsupported"
      ? "AI Unavailable"
      : isReady
        ? "AI Ready"
        : state.status === "loading"
          ? `AI Loading ${Math.round(state.progress * 100)}%`
          : state.status === "error"
            ? "AI Error"
            : "AI Idle";

  const aiTone =
    state.status === "unsupported" || state.status === "error"
      ? "bg-clay"
      : isReady
        ? "bg-forest-500"
        : "bg-sun";

  return (
    <div className="flex items-center gap-2 text-xs font-semibold">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
          online ? "bg-forest-100 text-forest-800" : "bg-cream-300 text-bark-700"
        }`}
        title={online ? "You are online" : "You are offline"}
      >
        <Dot className={online ? "bg-forest-500" : "bg-bark-500"} />
        {online ? "Online" : "Offline"}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-cream-50 ${aiTone}`}
        title={state.error ?? aiLabel}
      >
        <Dot className="bg-cream-50" />
        {aiLabel}
      </span>
    </div>
  );
}
