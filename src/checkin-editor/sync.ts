/**
 * Saving a draft to Rockd, in the app's two phases (`CheckinSyncService`):
 *
 * 1. **Metadata** — one `POST /protected/checkin` with the checkin and every
 *    observation. The response carries the checkin's id and a *slot* for each
 *    new photo (the id the server allocated, tagged with the client's file
 *    name).
 * 2. **Photos** — one `POST /protected/photos` per slot, retried a few times
 *    with backoff. A photo that still fails leaves the checkin saved and the
 *    photo pending, which is reported rather than hidden.
 *
 * Progress goes through callbacks so a page can draw it however it likes, and
 * `syncCheckins` runs the same thing over a list of drafts — the bulk case —
 * one at a time, since each is a few requests of its own.
 */
import { postCheckin, postPhoto, type PhotoSlot } from "./api";
import { buildCheckinPayload } from "./payload";
import { encodePhotoForUpload } from "./photos";
import type { CheckinDraft, LocalPhoto } from "./types";

export type SyncPhase = "idle" | "metadata" | "photos" | "done" | "failed";

export interface SyncProgress {
  phase: SyncPhase;
  /** Photos uploaded so far, of the total the server asked for */
  photosDone: number;
  photosTotal: number;
  /** The slot being uploaded, while in the photos phase */
  current?: PhotoSlot | null;
  /** A retry in progress: which attempt, after how long */
  retry?: { attempt: number; maxAttempts: number; delayMs: number } | null;
}

export interface SyncResult {
  status: "success" | "metadata_failed" | "photos_failed" | "cancelled";
  /** The checkin's server id, once the metadata phase has succeeded */
  checkinId?: number;
  xp?: number | null;
  error?: Error;
  /** Photos that never made it up (`photos_failed`) */
  failedPhotos?: PhotoSlot[];
}

export interface SyncOptions {
  personId: number;
  token: string;
  onProgress?: (progress: SyncProgress) => void;
  signal?: AbortSignal;
  maxPhotoAttempts?: number;
}

const BASE_DELAY_MS = 1500;

export async function syncCheckin(
  draft: CheckinDraft,
  options: SyncOptions
): Promise<SyncResult> {
  const { personId, token, onProgress, signal, maxPhotoAttempts = 3 } = options;
  const report = (progress: SyncProgress) => onProgress?.(progress);

  // Phase 1
  report({ phase: "metadata", photosDone: 0, photosTotal: 0 });
  let saved;
  try {
    const payload = buildCheckinPayload(draft, personId, token);
    saved = await postCheckin(payload, signal);
  } catch (error) {
    if (isAbort(error)) return { status: "cancelled" };
    report({ phase: "failed", photosDone: 0, photosTotal: 0 });
    return { status: "metadata_failed", error: asError(error) };
  }

  const checkinId = Number(saved.checkin_id);
  const xp = saved.xp?.total ?? null;
  const localPhotos = localPhotosByName(draft);
  // Only slots we hold a file for; the server never asks for others
  const slots = saved.photos.filter((s) => localPhotos.has(s.local_id));

  if (slots.length === 0) {
    report({ phase: "done", photosDone: 0, photosTotal: 0 });
    return { status: "success", checkinId, xp };
  }

  // Phase 2
  const uploaded = await uploadPhotoSlots(slots, localPhotos, {
    token,
    signal,
    maxPhotoAttempts,
    onProgress: report,
  });
  if (uploaded.cancelled) return { status: "cancelled", checkinId, xp };

  if (uploaded.failed.length > 0) {
    report({
      phase: "failed",
      photosDone: uploaded.done.size,
      photosTotal: slots.length,
    });
    return {
      status: "photos_failed",
      checkinId,
      xp,
      failedPhotos: uploaded.failed,
      error: new Error(
        `${uploaded.failed.length} of ${slots.length} photos didn't upload. The checkin itself is saved.`
      ),
    };
  }

  report({
    phase: "done",
    photosDone: uploaded.done.size,
    photosTotal: slots.length,
  });
  return { status: "success", checkinId, xp };
}

export interface UploadOutcome {
  /** Photo ids the server assigned, by the client's file name */
  done: Map<string, number>;
  failed: PhotoSlot[];
  cancelled: boolean;
}

/** The photo phase on its own, so photos that failed can be retried against
 * the slots the server already allocated rather than by saving again (which
 * would allocate new ids and orphan the old ones). */
export async function uploadPhotoSlots(
  slots: PhotoSlot[],
  photos: Map<string, LocalPhoto>,
  options: {
    token: string;
    signal?: AbortSignal;
    maxPhotoAttempts?: number;
    onProgress?: (progress: SyncProgress) => void;
  }
): Promise<UploadOutcome> {
  const { token, signal, maxPhotoAttempts = 3 } = options;
  const report = (progress: SyncProgress) => options.onProgress?.(progress);
  const done = new Map<string, number>();
  const failed: PhotoSlot[] = [];

  for (const slot of slots) {
    const photo = photos.get(slot.local_id);
    if (photo == null) {
      failed.push(slot);
      continue;
    }
    report({
      phase: "photos",
      photosDone: done.size,
      photosTotal: slots.length,
      current: slot,
    });
    const outcome = await uploadWithRetry(photo, slot, token, {
      signal,
      maxAttempts: maxPhotoAttempts,
      onRetry: (retry) =>
        report({
          phase: "photos",
          photosDone: done.size,
          photosTotal: slots.length,
          current: slot,
          retry,
        }),
    });
    if (outcome === "cancelled") return { done, failed, cancelled: true };
    if (typeof outcome === "number") done.set(slot.local_id, outcome);
    else failed.push(slot);
  }
  return { done, failed, cancelled: false };
}

/** Several drafts, one after another. Stops early only when cancelled. */
export async function syncCheckins(
  drafts: CheckinDraft[],
  options: SyncOptions & {
    onEach?: (draft: CheckinDraft, result: SyncResult, index: number) => void;
  }
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const [index, draft] of drafts.entries()) {
    const result = await syncCheckin(draft, options);
    results.push(result);
    options.onEach?.(draft, result, index);
    if (result.status === "cancelled") break;
  }
  return results;
}

async function uploadWithRetry(
  photo: LocalPhoto,
  slot: PhotoSlot,
  token: string,
  opts: {
    signal?: AbortSignal;
    maxAttempts: number;
    onRetry: (r: {
      attempt: number;
      maxAttempts: number;
      delayMs: number;
    }) => void;
  }
): Promise<number | "failed" | "cancelled"> {
  let image: string;
  try {
    image = await encodePhotoForUpload(photo);
  } catch {
    // A file the browser can't read won't get better with retries
    return "failed";
  }
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const { photo_id } = await postPhoto(slot, image, token, opts.signal);
      return Number(photo_id);
    } catch (error) {
      if (isAbort(error)) return "cancelled";
      // The server said no (not found, forbidden, bad payload): retrying won't help
      if (isClientError(error)) return "failed";
      if (attempt === opts.maxAttempts) return "failed";
      const delayMs = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), 10_000);
      opts.onRetry({ attempt, maxAttempts: opts.maxAttempts, delayMs });
      const waited = await delay(delayMs, opts.signal);
      if (!waited) return "cancelled";
    }
  }
  return "failed";
}

export function localPhotosByName(
  draft: CheckinDraft
): Map<string, LocalPhoto> {
  const photos = new Map<string, LocalPhoto>();
  if (draft.photo?.kind === "local")
    photos.set(draft.photo.localId, draft.photo);
  for (const obs of draft.observations) {
    if (obs.photo?.kind === "local") photos.set(obs.photo.localId, obs.photo);
  }
  return photos;
}

function isAbort(error: unknown): boolean {
  return (error as { name?: string })?.name === "AbortError";
}

function isClientError(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  return status != null && status >= 400 && status < 500;
}

function asError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

/** Resolves true after `ms`, or false at once if the signal aborts */
function delay(ms: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(false);
    const timer = setTimeout(() => resolve(true), ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve(false);
      },
      { once: true }
    );
  });
}
