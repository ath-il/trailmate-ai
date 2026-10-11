/**
 * Curated list of small (1B-3B) instruction models that WebLLM ships prebuilt
 * libraries for. Model identifiers are taken from WebLLM's `prebuiltAppConfig`
 * (verified against @mlc-ai/web-llm 0.2.86).
 *
 * We favour `low_resource_required` models so they run on phones and laptops.
 */
export interface ModelOption {
  id: string;
  label: string;
  /** Approximate VRAM footprint in MB, from WebLLM's config. */
  vramMB: number;
  /** Short human note. */
  note: string;
  /** true when the model needs the WebGPU shader-f16 feature. */
  needsF16: boolean;
  /** Marks the recommended default model. */
  recommended?: boolean;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    // Google's open-weight Gemma 3, run fully offline in the browser via WebLLM.
    id: "gemma3-1b-it-q4f16_1-MLC",
    label: "Gemma 3 1B Instruct",
    vramMB: 711,
    note: "Default. Google's open-weight Gemma 3, run fully offline in your browser.",
    needsF16: false,
    recommended: true,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 1B Instruct",
    vramMB: 879,
    note: "Meta's open-weight Llama 3.2. Fast and very compatible.",
    needsF16: false,
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen2.5 1.5B Instruct",
    vramMB: 1630,
    note: "A little larger, often produces richer text.",
    needsF16: false,
  },
  {
    id: "Qwen2.5-3B-Instruct-q4f32_1-MLC",
    label: "Qwen2.5 3B Instruct",
    vramMB: 2894,
    note: "Best quality of the set, needs a more capable device.",
    needsF16: false,
  },
];

export const DEFAULT_MODEL_ID =
  MODEL_OPTIONS.find((m) => m.recommended)?.id ?? MODEL_OPTIONS[0].id;

export function getModelOption(id: string): ModelOption {
  return MODEL_OPTIONS.find((m) => m.id === id) ?? MODEL_OPTIONS[0];
}
