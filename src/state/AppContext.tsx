import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addEntry,
  clearAllEntries,
  deleteEntry,
  getAllEntries,
  getEntryByMission,
} from "../lib/db";
import { toDateKey } from "../lib/date";
import { makeId } from "../lib/id";
import { loadPrefs, savePrefs } from "../lib/prefs";
import { computeStats } from "../lib/stats";
import {
  POINTS_PER_MISSION,
  type AppStats,
  type JournalEntry,
  type Mission,
  type MissionPrefs,
} from "../types";

interface CompletionOutcome {
  awarded: boolean;
  entry: JournalEntry;
}

interface AppContextValue {
  prefs: MissionPrefs;
  updatePrefs: (patch: Partial<MissionPrefs>) => void;
  entries: JournalEntry[];
  stats: AppStats;
  entriesLoaded: boolean;
  activeMission: Mission | null;
  setActiveMission: (mission: Mission | null) => void;
  completeMission: (
    mission: Mission,
    reflection: string,
  ) => Promise<CompletionOutcome>;
  removeEntry: (id: string) => Promise<void>;
  clearJournal: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<MissionPrefs>(() => loadPrefs());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  const refreshEntries = useCallback(async () => {
    try {
      const all = await getAllEntries();
      setEntries(all);
    } catch (err) {
      console.error("Failed to read journal from IndexedDB:", err);
    } finally {
      setEntriesLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refreshEntries();
  }, [refreshEntries]);

  const updatePrefs = useCallback((patch: Partial<MissionPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  const completeMission = useCallback(
    async (mission: Mission, reflection: string): Promise<CompletionOutcome> => {
      const existing = await getEntryByMission(mission.id);
      if (existing) {
        // No duplicate points for the same mission instance.
        return { awarded: false, entry: existing };
      }
      const now = Date.now();
      const entry: JournalEntry = {
        id: makeId(),
        missionId: mission.id,
        mission,
        completedAt: now,
        date: toDateKey(new Date(now)),
        reflection: reflection.trim(),
        points: POINTS_PER_MISSION,
      };
      await addEntry(entry);
      await refreshEntries();
      return { awarded: true, entry };
    },
    [refreshEntries],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      await deleteEntry(id);
      await refreshEntries();
    },
    [refreshEntries],
  );

  const clearJournal = useCallback(async () => {
    await clearAllEntries();
    await refreshEntries();
  }, [refreshEntries]);

  const stats = useMemo(() => computeStats(entries), [entries]);

  const value = useMemo<AppContextValue>(
    () => ({
      prefs,
      updatePrefs,
      entries,
      stats,
      entriesLoaded,
      activeMission,
      setActiveMission,
      completeMission,
      removeEntry,
      clearJournal,
    }),
    [
      prefs,
      updatePrefs,
      entries,
      stats,
      entriesLoaded,
      activeMission,
      completeMission,
      removeEntry,
      clearJournal,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
