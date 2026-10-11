import { useState } from "react";
import { StatusBar } from "../components/StatusBar";
import { Spinner } from "../components/Spinner";
import { MODEL_OPTIONS, getModelOption } from "../lib/ai/models";
import { useAI } from "../state/AIContext";
import { useApp } from "../state/AppContext";
import { useInstallPrompt } from "../state/install";
import { useOnline } from "../state/online";

export function SettingsPage() {
  const {
    state,
    modelId,
    setModelId,
    load,
    unload,
    clearModel,
    isReady,
    modelCached,
  } = useAI();
  const { clearJournal, stats } = useApp();
  const online = useOnline();
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt();
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = getModelOption(modelId);

  async function handleClearModel() {
    setClearing(true);
    setMessage(null);
    try {
      await clearModel();
      setMessage(
        "Cached model data was cleared. Use Prepare local AI to download it again.",
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-5 pb-28">
      <header className="pt-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600">
          Settings
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-forest-900">
          Local AI & storage
        </h1>
      </header>

      <StatusBar />

      <section className="card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Model status
        </h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-bark-500">Status</dt>
          <dd className="font-semibold text-forest-900">
            {state.status === "unsupported"
              ? "Unavailable (no WebGPU)"
              : state.status === "loading"
                ? `Loading ${Math.round(state.progress * 100)}%`
                : isReady
                  ? "Ready"
                  : state.status === "error"
                    ? "Error"
                    : "Not loaded"}
          </dd>
          <dt className="text-bark-500">Selected</dt>
          <dd className="font-semibold text-forest-900">{selected.label}</dd>
          <dt className="text-bark-500">Approx. size</dt>
          <dd className="font-semibold text-forest-900">
            ~{selected.vramMB} MB VRAM
          </dd>
          <dt className="text-bark-500">Network</dt>
          <dd className="font-semibold text-forest-900">
            {online ? "Online" : "Offline"}
          </dd>
          <dt className="text-bark-500">Downloaded</dt>
          <dd className="font-semibold text-forest-900">
            {modelCached === null
              ? "Checking..."
              : modelCached
                ? "Yes, cached on device"
                : "No, first run needs internet"}
          </dd>
        </dl>
        {state.error && <p className="text-xs text-clay">{state.error}</p>}
        {state.status === "loading" && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-cream-300">
            <div
              className="h-full rounded-full bg-forest-600 transition-all"
              style={{ width: `${Math.round(state.progress * 100)}%` }}
            />
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Choose a model
        </h2>
        <div className="space-y-2">
          {MODEL_OPTIONS.map((model) => {
            const active = model.id === modelId;
            return (
              <label
                key={model.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                  active
                    ? "border-forest-700 bg-forest-50"
                    : "border-forest-100 hover:border-forest-300"
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  className="mt-1 accent-forest-700"
                  checked={active}
                  onChange={() => setModelId(model.id)}
                />
                <span>
                  <span className="flex items-center gap-2 font-semibold text-forest-900">
                    {model.label}
                    {model.recommended && (
                      <span className="rounded-full bg-forest-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream-50">
                        Default
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-bark-500">
                    {model.note} (~{model.vramMB} MB)
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-bark-400">
          Changing the model requires loading it again. Smaller models are faster
          and use less memory.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Model controls
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={state.status === "loading" || state.status === "unsupported"}
            className="btn-primary"
          >
            {state.status === "loading" && <Spinner />}
            {isReady ? "Reload model" : "Prepare local AI"}
          </button>
          <button
            type="button"
            onClick={() => void unload()}
            disabled={!isReady && state.status !== "loading"}
            className="btn-secondary"
          >
            Unload from memory
          </button>
          <button
            type="button"
            onClick={() => void handleClearModel()}
            disabled={clearing}
            className="btn-ghost text-clay"
          >
            {clearing ? "Clearing..." : "Clear downloaded model data"}
          </button>
        </div>
        {message && (
          <p className="rounded-2xl bg-cream-200 p-3 text-sm text-bark-700">
            {message}
          </p>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Journal data
        </h2>
        <p className="text-sm text-bark-600">
          {stats.completedCount} entries stored locally in IndexedDB. Nothing is
          ever uploaded.
        </p>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Delete all journal entries and reset your points? This cannot be undone.",
              )
            ) {
              void clearJournal();
            }
          }}
          className="btn-ghost text-clay"
        >
          Clear all journal entries
        </button>
      </section>

      <section className="card space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          How offline mode works
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-bark-600">
          <li>
            A service worker caches the app shell, so the app opens without a
            network connection once installed.
          </li>
          <li>
            The local model is downloaded once (this needs internet) and then
            cached by WebLLM. After that, generation works offline.
          </li>
          <li>
            If the browser evicts storage under pressure, the model may need
            downloading again.
          </li>
          <li>
            WebGPU support is required for local AI. Without it, the app uses
            bundled offline missions instead.
          </li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-forest-700">
          Install the app
        </h2>
        {installed ? (
          <p className="text-sm text-bark-600">
            Installed. Open TrailMate from your home screen or app list — it
            launches full screen and works offline.
          </p>
        ) : (
          <>
            <p className="text-sm text-bark-600">
              Install TrailMate to your device for a full-screen, offline app.
            </p>
            {canInstall ? (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="btn-primary w-full"
              >
                Install TrailMate
              </button>
            ) : isIOS ? (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-bark-600">
                <li>Open this page in Safari.</li>
                <li>Tap the Share button.</li>
                <li>Choose “Add to Home Screen”.</li>
              </ol>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-bark-600">
                <li>Open the browser menu (⋮ or ⋯).</li>
                <li>Choose “Install app” or “Add to Home screen”.</li>
                <li>Confirm to add it to your device.</li>
              </ol>
            )}
            <p className="text-xs text-bark-400">
              Installation requires the site to be served over HTTPS (or
              localhost).
            </p>
          </>
        )}
      </section>
    </div>
  );
}
