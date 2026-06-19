import OBR from "@owlbear-rodeo/sdk";
import type { CalendarProject } from "../domain/types";
import {
  buildPublicCalendarIndex,
  createPublicCalendarTodaySnapshot,
  estimateJsonSize,
  isPublicCalendarIndex,
  isPublicCalendarTodaySnapshot,
  type PublicCalendarIndex,
  type PublicCalendarTodaySnapshot
} from "./publicSnapshot";

export { buildPublicCalendarIndex } from "./publicSnapshot";
export type { PublicCalendarIndex, PublicCalendarTodaySnapshot } from "./publicSnapshot";

const PUBLIC_INDEX_KEY = "com.gmtools.calendar-obr/publicIndex";
const SNAPSHOT_CACHE_KEY = "calendar-obr.publicSnapshot.cache";
const SNAPSHOT_REQUEST_CHANNEL = "com.gmtools.calendar-obr/requestPublicSnapshot";
export const SNAPSHOT_RESPONSE_CHANNEL = "com.gmtools.calendar-obr/publicSnapshot";
const SNAPSHOT_WARN_SIZE = 12_000;

type SnapshotRequestMessage = {
  type: "request-today-snapshot";
};

type SnapshotResponseMessage = {
  type: "today-snapshot";
  snapshot: PublicCalendarTodaySnapshot;
};

const onObrReady = async <T>(callback: () => Promise<T> | T, fallback: T): Promise<T> => {
  if (!OBR.isAvailable) return fallback;

  return new Promise((resolve) => {
    OBR.onReady(async () => {
      try {
        resolve(await callback());
      } catch (error) {
        console.warn("Calendar OBR public sync failed", error);
        resolve(fallback);
      }
    });
  });
};

export const readPublicIndex = async (): Promise<PublicCalendarIndex | null> =>
  onObrReady(async () => {
    const metadata = await OBR.room.getMetadata();
    const value = metadata[PUBLIC_INDEX_KEY];
    return isPublicCalendarIndex(value) ? value : null;
  }, null);

export const publishPublicIndex = async (index: PublicCalendarIndex): Promise<void> => {
  await onObrReady(async () => {
    await OBR.room.setMetadata({ [PUBLIC_INDEX_KEY]: index });
  }, undefined);
};

export const readCachedPublicSnapshot = (): PublicCalendarTodaySnapshot | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SNAPSHOT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isPublicCalendarTodaySnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writeCachedPublicSnapshot = (snapshot: PublicCalendarTodaySnapshot): void => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Calendar OBR public snapshot cache failed", error);
  }
};

const getSnapshotCacheKey = (scopeId?: string): string =>
  scopeId && scopeId.length > 0 ? `${SNAPSHOT_CACHE_KEY}.${scopeId}` : SNAPSHOT_CACHE_KEY;

export const readScopedCachedPublicSnapshot = (scopeId?: string): PublicCalendarTodaySnapshot | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(getSnapshotCacheKey(scopeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isPublicCalendarTodaySnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writeScopedCachedPublicSnapshot = (snapshot: PublicCalendarTodaySnapshot, scopeId?: string): void => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(getSnapshotCacheKey(scopeId), JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Calendar OBR public snapshot cache failed", error);
  }
};

export const setupPlayerSnapshotListener = (callback: (snapshot: PublicCalendarTodaySnapshot) => void): (() => void) => {
  if (!OBR.isAvailable) return () => undefined;

  let unsubscribe: () => void = () => undefined;
  OBR.onReady(() => {
    unsubscribe = OBR.broadcast.onMessage(SNAPSHOT_RESPONSE_CHANNEL, (event) => {
      const data = event.data;
      if (!isSnapshotResponseMessage(data)) return;
      callback(data.snapshot);
    });
  });

  return () => unsubscribe();
};

export const publishPublicSnapshot = async (project: CalendarProject, revision: number): Promise<void> => {
  await onObrReady(async () => {
    const snapshot = createPublicCalendarTodaySnapshot(project, revision);
    const size = estimateJsonSize(snapshot);
    if (size > SNAPSHOT_WARN_SIZE) {
      console.warn(`Calendar OBR public snapshot is large (${size} bytes).`);
    }

    const response: SnapshotResponseMessage = { type: "today-snapshot", snapshot };
    await OBR.broadcast.sendMessage(SNAPSHOT_RESPONSE_CHANNEL, response, { destination: "REMOTE" });
  }, undefined);
};

export const requestPublicSnapshot = async (): Promise<void> => {
  await onObrReady(async () => {
    const message: SnapshotRequestMessage = { type: "request-today-snapshot" };
    await OBR.broadcast.sendMessage(SNAPSHOT_REQUEST_CHANNEL, message, { destination: "REMOTE" });
  }, undefined);
};

export const subscribePublicIndex = (callback: (index: PublicCalendarIndex) => void): (() => void) => {
  if (!OBR.isAvailable) return () => undefined;

  let unsubscribe: () => void = () => undefined;
  OBR.onReady(() => {
    unsubscribe = OBR.room.onMetadataChange((metadata) => {
      const value = metadata[PUBLIC_INDEX_KEY];
      if (!isPublicCalendarIndex(value)) return;
      callback(value);
    });
  });

  return () => unsubscribe();
};

export const setupGmSnapshotResponder = (
  getProject: () => CalendarProject,
  getRevision: () => number
): (() => void) => {
  if (!OBR.isAvailable) return () => undefined;

  let unsubscribe: () => void = () => undefined;
  OBR.onReady(() => {
    unsubscribe = OBR.broadcast.onMessage(SNAPSHOT_REQUEST_CHANNEL, async (event) => {
      if (!isSnapshotRequestMessage(event.data)) return;

      await publishPublicSnapshot(getProject(), getRevision());
    });
  });

  return () => unsubscribe();
};

const isSnapshotRequestMessage = (value: unknown): value is SnapshotRequestMessage =>
  typeof value === "object" && value !== null && (value as { type?: unknown }).type === "request-today-snapshot";

const isSnapshotResponseMessage = (value: unknown): value is SnapshotResponseMessage => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { type?: unknown; snapshot?: unknown };
  return candidate.type === "today-snapshot" && isPublicCalendarTodaySnapshot(candidate.snapshot);
};
