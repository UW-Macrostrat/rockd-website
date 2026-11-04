/**
 * Unsaved edits, kept in `localStorage` so a reload or a closed tab doesn't
 * lose them — the web's version of the app's "unsynced" queue. A draft is
 * stored under its key (the server id, or the client id for a new checkin).
 *
 * Local photo files can't be serialized here, so a stored draft drops them
 * and says so (`droppedPhotos`); the rest of the edit survives.
 */
import type { CheckinDraft, ObservationDraft } from "./types";

const PREFIX = "rockd-checkin-draft:";

export interface StoredDraft {
  draft: CheckinDraft;
  /** When it was last written */
  savedAt: string;
  /** Local photos the stored copy couldn't keep */
  droppedPhotos: number;
}

export function saveDraft(key: string, draft: CheckinDraft) {
  if (!canStore()) return;
  const { draft: stripped, droppedPhotos } = stripLocalPhotos(draft);
  const stored: StoredDraft = {
    draft: stripped,
    savedAt: new Date().toISOString(),
    droppedPhotos,
  };
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(stored));
  } catch {
    // Storage full or disabled; the in-memory draft is unaffected
  }
}

export function loadDraft(key: string): StoredDraft | null {
  if (!canStore()) return null;
  const raw = localStorage.getItem(PREFIX + key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as StoredDraft;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  if (!canStore()) return;
  localStorage.removeItem(PREFIX + key);
}

/** Every stored draft, newest first */
export function listDrafts(): { key: string; stored: StoredDraft }[] {
  if (!canStore()) return [];
  const out: { key: string; stored: StoredDraft }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const name = localStorage.key(i);
    if (name == null || !name.startsWith(PREFIX)) continue;
    const stored = loadDraft(name.slice(PREFIX.length));
    if (stored != null) out.push({ key: name.slice(PREFIX.length), stored });
  }
  out.sort((a, b) => b.stored.savedAt.localeCompare(a.stored.savedAt));
  return out;
}

function canStore(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function stripLocalPhotos(draft: CheckinDraft): {
  draft: CheckinDraft;
  droppedPhotos: number;
} {
  let dropped = 0;
  let photo = draft.photo;
  if (photo?.kind === "local") {
    photo = null;
    dropped += 1;
  }
  const observations: ObservationDraft[] = draft.observations.map((obs) => {
    if (obs.photo?.kind !== "local") return obs;
    dropped += 1;
    return { ...obs, photo: null };
  });
  return { draft: { ...draft, photo, observations }, droppedPhotos: dropped };
}
