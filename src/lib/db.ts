import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { JournalEntry } from "../types";

interface TrailMateDB extends DBSchema {
  entries: {
    key: string;
    value: JournalEntry;
    indexes: {
      "by-mission": string;
      "by-date": string;
      "by-completed": number;
    };
  };
}

const DB_NAME = "trailmate-ai";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TrailMateDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TrailMateDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TrailMateDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("entries", { keyPath: "id" });
        store.createIndex("by-mission", "missionId");
        store.createIndex("by-date", "date");
        store.createIndex("by-completed", "completedAt");
      },
    });
  }
  return dbPromise;
}

export async function getAllEntries(): Promise<JournalEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("entries", "by-completed");
  return all.reverse(); // newest first
}

export async function getEntry(id: string): Promise<JournalEntry | undefined> {
  const db = await getDB();
  return db.get("entries", id);
}

export async function getEntryByMission(
  missionId: string,
): Promise<JournalEntry | undefined> {
  const db = await getDB();
  const matches = await db.getAllFromIndex("entries", "by-mission", missionId);
  return matches[0];
}

export async function addEntry(entry: JournalEntry): Promise<void> {
  const db = await getDB();
  await db.put("entries", entry);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("entries", id);
}

export async function clearAllEntries(): Promise<void> {
  const db = await getDB();
  await db.clear("entries");
}
