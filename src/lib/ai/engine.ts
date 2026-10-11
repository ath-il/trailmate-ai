import type { InitProgressReport, MLCEngineInterface } from "@mlc-ai/web-llm";

export type AIStatus =
  | "unsupported"
  | "idle"
  | "loading"
  | "ready"
  | "generating"
  | "error";

export interface AIState {
  status: AIStatus;
  /** 0..1 while loading. */
  progress: number;
  progressText: string;
  modelId: string;
  error: string | null;
}

export type AIListener = (state: AIState) => void;

/**
 * WebGPU capability probe. WebLLM requires WebGPU; without it local inference
 * is impossible and the app falls back to bundled offline missions.
 */
export async function checkWebGPU(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    return {
      ok: false,
      reason: "This browser does not expose the WebGPU API (navigator.gpu).",
    };
  }
  try {
    const gpu = (
      navigator as Navigator & {
        gpu: { requestAdapter(): Promise<unknown> };
      }
    ).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return {
        ok: false,
        reason:
          "WebGPU is present but no GPU adapter is available (often on unsupported hardware or inside a virtual machine).",
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: `WebGPU adapter request failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

export function formatLoadText(text: string): string {
  // WebLLM reports progress as "Fetching param cache[12/40]: 123MB fetched ..."
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

/**
 * Thin facade over WebLLM. The heavy WebLLM bundle is imported dynamically so
 * it stays out of the initial app shell and is only fetched when local AI is
 * actually used. Inference itself runs inside a dedicated web worker.
 */
class LocalAI {
  private engine: MLCEngineInterface | null = null;
  private worker: Worker | null = null;
  private currentModelId: string | null = null;
  private loadPromise: Promise<void> | null = null;
  private listeners = new Set<AIListener>();

  private state: AIState = {
    status: "idle",
    progress: 0,
    progressText: "",
    modelId: "",
    error: null,
  };

  subscribe(listener: AIListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): AIState {
    return this.state;
  }

  isReady(): boolean {
    return this.state.status === "ready" || this.state.status === "generating";
  }

  isLoaded(modelId: string): boolean {
    return this.engine !== null && this.currentModelId === modelId;
  }

  private emit(patch: Partial<AIState>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
  }

  private disposeWorker(): void {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {
        /* ignore */
      }
      this.worker = null;
    }
    this.engine = null;
    this.currentModelId = null;
  }

  /**
   * Detects whether local AI is even possible on this device, without loading
   * any weights. Used on startup to show an honest AI Ready / Unavailable badge.
   */
  async probe(): Promise<void> {
    if (this.engine) return;
    const gpu = await checkWebGPU();
    if (!gpu.ok) {
      this.emit({ status: "unsupported", error: gpu.reason });
    }
  }

  async load(modelId: string): Promise<void> {
    if (this.isLoaded(modelId)) {
      this.emit({ status: "ready", modelId, error: null });
      return;
    }
    if (this.loadPromise) return this.loadPromise;

    const gpu = await checkWebGPU();
    if (!gpu.ok) {
      this.emit({ status: "unsupported", error: gpu.reason, modelId });
      return;
    }

    this.disposeWorker();
    this.emit({
      status: "loading",
      progress: 0,
      progressText: "Starting local AI engine...",
      modelId,
      error: null,
    });

    this.loadPromise = (async () => {
      try {
        const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
        const worker = new Worker(new URL("./worker.ts", import.meta.url), {
          type: "module",
        });
        this.worker = worker;

        const engine = await CreateWebWorkerMLCEngine(worker, modelId, {
          initProgressCallback: (report: InitProgressReport) => {
            this.emit({
              status: "loading",
              progress: Math.max(0, Math.min(1, report.progress || 0)),
              progressText: formatLoadText(report.text || "Loading model..."),
              modelId,
            });
          },
        });

        this.engine = engine;
        this.currentModelId = modelId;
        this.emit({
          status: "ready",
          progress: 1,
          progressText: "Local AI ready",
          modelId,
          error: null,
        });
      } catch (err) {
        this.engine = null;
        this.currentModelId = null;
        this.emit({
          status: "error",
          progress: 0,
          progressText: "",
          modelId,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  async generate(
    prompt: string,
    onToken?: (partial: string) => void,
  ): Promise<string> {
    if (!this.engine) throw new Error("Local AI is not loaded.");
    this.emit({ status: "generating", error: null });

    const chunks = await this.engine.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are TrailMate AI, a practical outdoor guide. You always answer with a single valid JSON object and nothing else.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 640,
      stream: true,
    });

    let full = "";
    for await (const chunk of chunks) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        full += delta;
        onToken?.(full);
      }
    }

    this.emit({ status: "ready" });
    return full;
  }

  /** True when the model weights are already downloaded and cached locally. */
  async isModelCached(modelId: string): Promise<boolean> {
    try {
      const { hasModelInCache } = await import("@mlc-ai/web-llm");
      return await hasModelInCache(modelId);
    } catch {
      return false;
    }
  }

  async unload(): Promise<void> {
    const engine = this.engine;
    this.disposeWorker();
    this.emit({ status: "idle", progress: 0, progressText: "", error: null });
    if (engine) {
      try {
        await engine.unload();
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Deletes the downloaded weights for a model from WebLLM's cache.
   * Uses WebLLM's own helper, then falls back to clearing any Cache API entries
   * that reference the model id.
   */
  async clearModelCache(modelId: string): Promise<void> {
    if (this.currentModelId === modelId) {
      await this.unload();
    }

    try {
      const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm");
      await deleteModelAllInfoInCache(modelId);
    } catch {
      /* fall through to manual clearing */
    }

    if (typeof caches !== "undefined") {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter(
              (k) => k.includes(modelId) || k.toLowerCase().includes("webllm"),
            )
            .map((k) => caches.delete(k)),
        );
      } catch {
        /* ignore */
      }
    }
  }
}

export const localAI = new LocalAI();
