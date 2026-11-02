/**
 * The editor's state as jotai atoms: the draft, the version it started from,
 * and what follows from the two (dirtiness, validation, the save state).
 * Edits are write-only atoms over pure functions on the draft, so the same
 * operations serve one checkin here and many in a bulk editor.
 *
 * Each editor mounts its own jotai store (`createStore`), so two editors on
 * one page don't share a draft.
 */
import { atom } from "jotai";
import type { PhotoSlot } from "./api";
import type { SyncProgress } from "./sync";
import {
  type CheckinDraft,
  type ObservationDraft,
  type PhotoRef,
  newObservation,
} from "./types";
import { releaseLocalPhoto } from "./photos";
import { type CheckinErrors, validateCheckin } from "./validation";

export const draftAtom = atom<CheckinDraft | null>(null);
/** The draft as loaded (or as last saved): what "unsaved changes" is against */
export const originalAtom = atom<CheckinDraft | null>(null);

export const isDirtyAtom = atom((get) => {
  const draft = get(draftAtom);
  const original = get(originalAtom);
  if (draft == null || original == null) return false;
  return serialize(draft) !== serialize(original);
});

export const errorsAtom = atom<CheckinErrors>((get) => {
  const draft = get(draftAtom);
  if (draft == null) return {};
  return validateCheckin(draft);
});

/** Validation is shown after the first save attempt, not while typing */
export const showErrorsAtom = atom(false);

export interface SaveState {
  progress: SyncProgress;
  error: Error | null;
  failedPhotos: PhotoSlot[];
  /** Experience awarded by the last save, as the app reports it */
  xp: number | null;
}

export const saveStateAtom = atom<SaveState>({
  progress: { phase: "idle", photosDone: 0, photosTotal: 0 },
  error: null,
  failedPhotos: [],
  xp: null,
});

export const isSavingAtom = atom((get) => {
  const { phase } = get(saveStateAtom).progress;
  return phase === "metadata" || phase === "photos";
});

// ---- Edits ----

/** Replaces the draft and the baseline together (load, restore, after save) */
export const resetDraftAtom = atom(null, (_get, set, draft: CheckinDraft) => {
  set(draftAtom, draft);
  set(originalAtom, draft);
  set(showErrorsAtom, false);
});

export const updateCheckinAtom = atom(
  null,
  (get, set, changes: Partial<CheckinDraft>) => {
    const draft = get(draftAtom);
    if (draft == null) return;
    set(draftAtom, { ...draft, ...changes });
  }
);

export const setCheckinPhotoAtom = atom(
  null,
  (get, set, photo: PhotoRef | null) => {
    const draft = get(draftAtom);
    if (draft == null) return;
    if (draft.photo?.kind === "local" && draft.photo !== photo) {
      releaseLocalPhoto(draft.photo);
    }
    set(draftAtom, { ...draft, photo });
  }
);

export const addObservationAtom = atom(null, (get, set): string | null => {
  const draft = get(draftAtom);
  if (draft == null) return null;
  const obs = newObservation();
  set(draftAtom, { ...draft, observations: [...draft.observations, obs] });
  return obs.new_obs_id ?? null;
});

export const updateObservationAtom = atom(
  null,
  (get, set, index: number, changes: Partial<ObservationDraft>) => {
    const draft = get(draftAtom);
    if (draft == null) return;
    const observations = draft.observations.map((obs, i) => {
      if (i !== index) return obs;
      if (
        changes.photo !== undefined &&
        obs.photo?.kind === "local" &&
        obs.photo !== changes.photo
      ) {
        releaseLocalPhoto(obs.photo);
      }
      return { ...obs, ...changes };
    });
    set(draftAtom, { ...draft, observations });
  }
);

export const removeObservationAtom = atom(null, (get, set, index: number) => {
  const draft = get(draftAtom);
  if (draft == null) return;
  const removed = draft.observations[index];
  if (removed?.photo?.kind === "local") releaseLocalPhoto(removed.photo);
  set(draftAtom, {
    ...draft,
    observations: draft.observations.filter((_, i) => i !== index),
  });
});

/** The draft's identity for storage and comparison. Local photo files are
 * compared by name; a File has no stable serialization. */
export function serialize(draft: CheckinDraft): string {
  return JSON.stringify(draft, (key, value) => {
    if (key === "file" || key === "previewURL" || key === "exif")
      return undefined;
    return value;
  });
}

/** An observation's key for lists: the server's id, else the client's */
export function observationKey(obs: ObservationDraft): string {
  if (obs.obs_id != null) return `obs-${obs.obs_id}`;
  return `new-${obs.new_obs_id}`;
}
