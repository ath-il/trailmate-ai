import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { localAI, type AIState } from "../lib/ai/engine";
import { DEFAULT_MODEL_ID, getModelOption } from "../lib/ai/models";
import { loadModelId, saveModelId } from "../lib/prefs";

interface AIContextValue {
  state: AIState;
  modelId: string;
  setModelId: (id: string) => void;
  load: () => Promise<void>;
  unload: () => Promise<void>;
  clearModel: (id?: string) => Promise<void>;
  isReady: boolean;
  /** null while unknown, otherwise whether the selected model is downloaded. */
  modelCached: boolean | null;
  refreshCached: () => void;
}

const AIContext = createContext<AIContextValue | null>(null);

export function AIProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AIState>(() => localAI.getState());
  const [modelId, setModelIdState] = useState<string>(() =>
    loadModelId(DEFAULT_MODEL_ID),
  );
  const [modelCached, setModelCached] = useState<boolean | null>(null);

  useEffect(() => localAI.subscribe(setState), []);

  useEffect(() => {
    // Determine capabilities up front so the badge is honest before any load.
    void localAI.probe();
  }, []);

  const refreshCached = useCallback(() => {
    setModelCached(null);
    void localAI.isModelCached(modelId).then(setModelCached);
  }, [modelId]);

  useEffect(() => {
    refreshCached();
  }, [refreshCached]);

  // Re-check cached state whenever the engine finishes loading.
  useEffect(() => {
    if (state.status === "ready") refreshCached();
  }, [state.status, refreshCached]);

  const setModelId = useCallback((id: string) => {
    setModelIdState(id);
    saveModelId(id);
  }, []);

  const load = useCallback(async () => {
    await localAI.load(modelId);
  }, [modelId]);

  const unload = useCallback(async () => {
    await localAI.unload();
  }, []);

  const clearModel = useCallback(
    async (id?: string) => {
      await localAI.clearModelCache(id ?? modelId);
      refreshCached();
    },
    [modelId, refreshCached],
  );

  const value = useMemo<AIContextValue>(
    () => ({
      state,
      modelId,
      setModelId,
      load,
      unload,
      clearModel,
      isReady: state.status === "ready" || state.status === "generating",
      modelCached,
      refreshCached,
    }),
    [
      state,
      modelId,
      setModelId,
      load,
      unload,
      clearModel,
      modelCached,
      refreshCached,
    ],
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error("useAI must be used within AIProvider");
  return ctx;
}

export { getModelOption };
