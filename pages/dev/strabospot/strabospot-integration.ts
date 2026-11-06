import { macrostratApiURL } from "~/settings";

const STRABOSPOT_SETUP_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/strabospot-setup`;
const SYNC_CHECKINS_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/sync-checkins-to-strabo`;
const RESYNC_PHOTOS_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/resync-strabo-photos`;

const STRABOSPOT_REFRESH_ENDPOINT = "https://strabospot.org/jwtauth/refresh";
const STORAGE_KEY = "strabospot-auth";
const STRABOSPOT_ROCKD_LOGIN_ENDPOINT = "https://strabospot.org/rockd_login";

/** The Rockd icon's greens, for the page's "linked" and "sent" marks: its
 * sage stripe (`base`, the icon's most common green), the darker green of
 * its outline (`dark`), a lighter tint of the sage for a gradient's top, and
 * a deep green for text and ticks on it (readable on the sage) */
export const ROCKD_GREEN = {
  light: "#a9c6ae",
  base: "#93b398",
  dark: "#759a7b",
  ink: "#23402a",
};

/** StraboSpot's logo, beside its link button and its links in the page */
export const STRABOSPOT_LOGO_URL =
  "https://strabospot.org/includes/mimages/pic01.jpg";

export interface StrabospotLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: { pkey: string; email: string; name: string };
}

export interface StrabospotRefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface StoredStrabospotAuth {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user?: { pkey: string; email: string; name: string };
  datasetId?: number;
  projectId?: number;
}

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function saveStoredStrabospotAuth(auth: StoredStrabospotAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export async function refreshStrabospotToken(refreshToken: string) {
  const res = await fetch(STRABOSPOT_REFRESH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok)
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  return body as StrabospotRefreshResponse;
}

/**
 * Calls the backend to idempotently provision a "Rockd Checkins" dataset
 * and "Rockd Integration" project in StraboSpot, saves returned IDs to localStorage.
 */
export async function ensureRockdIntegrationResources(
  auth: StoredStrabospotAuth
): Promise<StoredStrabospotAuth> {
  const res = await fetch(STRABOSPOT_SETUP_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });
  const body = await parseJsonResponse(res);
  if (!res.ok)
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );

  const updatedAuth: StoredStrabospotAuth = {
    ...auth,
    datasetId: body.dataset_id,
    projectId: body.project_id,
  };
  saveStoredStrabospotAuth(updatedAuth);
  return updatedAuth;
}

export async function loginToStrabospotWithUUID(uuid: string) {
  const url = new URL(STRABOSPOT_ROCKD_LOGIN_ENDPOINT);
  url.searchParams.set("u", uuid);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "*/*" },
  });
  const body = await parseJsonResponse(res);
  if (!res.ok)
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  return body as StrabospotLoginResponse;
}

export async function loginAndRefreshStrabospotFromUUID(uuid: string) {
  const login = await loginToStrabospotWithUUID(uuid);
  const auth: StoredStrabospotAuth = {
    accessToken: login.access_token,
    refreshToken: login.refresh_token,
    tokenType: login.token_type,
    expiresIn: login.expires_in,
    user: login.user,
  };
  saveStoredStrabospotAuth(auth);
  return await ensureRockdIntegrationResources(auth);
}

export function getStoredStrabospotAuth(): StoredStrabospotAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as StoredStrabospotAuth;
  } catch {
    return null;
  }
}

export function getStrabospotDatasetId(): number | null {
  return getStoredStrabospotAuth()?.datasetId ?? null;
}

export function clearStoredStrabospotAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Photos of sent checkins that didn't reach StraboSpot, by checkin id. A
 * null list means the photo step failed before any photo was tried, so all of
 * that checkin's photos are still to go. */
export type PhotoFailures = Map<number, number[] | null>;

// Kept so the page can offer to resync them after a reload
const PHOTO_FAILURES_KEY = "strabospot-photo-failures";

export function getStoredPhotoFailures(): PhotoFailures {
  const failures: PhotoFailures = new Map();
  try {
    const raw = localStorage.getItem(PHOTO_FAILURES_KEY);
    if (raw == null) return failures;
    const stored = JSON.parse(raw);
    if (stored == null || typeof stored !== "object" || Array.isArray(stored)) {
      return failures;
    }
    for (const [id, photoIds] of Object.entries(stored)) {
      let photos: number[] | null = null;
      if (Array.isArray(photoIds)) photos = photoIds.map(Number);
      failures.set(Number(id), photos);
    }
  } catch {
    // Unreadable: start with none
  }
  return failures;
}

export function saveStoredPhotoFailures(failures: PhotoFailures) {
  try {
    if (failures.size === 0) {
      localStorage.removeItem(PHOTO_FAILURES_KEY);
      return;
    }
    localStorage.setItem(
      PHOTO_FAILURES_KEY,
      JSON.stringify(Object.fromEntries(failures))
    );
  } catch {
    // Storage unavailable (private mode): the failures last for this visit
  }
}

// Each synced checkin's `updated` time as Rockd reported it just after the
// sync (whose spot_id save sets it), by checkin id. A later `updated` means
// the checkin was edited since, and needs resyncing. Both times are the
// server's, so the browser's clock and time zone don't enter into it.
const SYNCED_AT_KEY = "strabospot-synced-at";

export function getStoredSyncedAt(): Record<string, string> {
  try {
    const stored = JSON.parse(localStorage.getItem(SYNCED_AT_KEY) ?? "{}");
    if (stored == null || typeof stored !== "object") return {};
    return stored;
  } catch {
    return {};
  }
}

export function saveStoredSyncedAt(syncedAt: Record<string, string>) {
  try {
    localStorage.setItem(SYNCED_AT_KEY, JSON.stringify(syncedAt));
  } catch {
    // Storage unavailable (private mode): edits won't be flagged after a reload
  }
}

/** True when the checkin's `updated` is after its recorded sync time. A
 * checkin with no recorded sync (sent before this was tracked, or from
 * another browser) is never flagged. */
export function editedSinceSync(
  updated: string | null | undefined,
  syncedAt: string | undefined
): boolean {
  if (updated == null || syncedAt == null) return false;
  return new Date(updated).getTime() > new Date(syncedAt).getTime();
}

export interface PhotoResyncResult {
  checkin_id: number;
  uploaded_photo_ids: number[];
  failed_photos: { photo_id: number; message: string }[];
}

/**
 * Uploads only a sent checkin's photos that failed before (all of them, with
 * `photoIds` null), leaving its spot and the photos already there alone.
 */
export async function resyncStrabospotPhotos(
  checkinId: number,
  photoIds: number[] | null,
  rockdToken: string
): Promise<PhotoResyncResult> {
  const auth = getStoredStrabospotAuth();
  if (auth == null || auth.accessToken == null) {
    throw new Error("StraboSpot is not linked. Missing access token.");
  }
  const res = await fetch(RESYNC_PHOTOS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      checkin_id: checkinId,
      photo_ids: photoIds,
      strabo_token: auth.accessToken,
      rockd_token: rockdToken,
    }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok)
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  return body as PhotoResyncResult;
}

export async function refreshStoredStrabospotAuth(): Promise<boolean> {
  const auth = getStoredStrabospotAuth();
  if (auth == null || auth.refreshToken == null) return false;
  try {
    const refresh = await refreshStrabospotToken(auth.refreshToken);
    saveStoredStrabospotAuth({
      ...auth,
      accessToken: refresh.access_token,
      tokenType: refresh.token_type ?? auth.tokenType,
      expiresIn: refresh.expires_in ?? auth.expiresIn,
    });
    return true;
  } catch {
    clearStoredStrabospotAuth();
    return false;
  }
}

/**
 * Sends selected checkins to StraboSpot via the backend pipeline.
 * All conversion, image upload, and spot_id persistence is handled server-side.
 */
export async function sendCheckinsToStrabospotDataset(
  checkins: any[],
  rockdToken: string
) {
  const auth = getStoredStrabospotAuth();
  if (auth == null || auth.accessToken == null || auth.datasetId == null) {
    throw new Error(
      "StraboSpot is not fully linked. Missing access token or dataset id."
    );
  }
  if (checkins.length === 0) throw new Error("No checkins selected.");

  const res = await fetch(SYNC_CHECKINS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      checkins,
      strabo_token: auth.accessToken,
      dataset_id: auth.datasetId,
      rockd_token: rockdToken,
    }),
  });

  const body = await parseJsonResponse(res);
  if (!res.ok)
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  return body;
}
