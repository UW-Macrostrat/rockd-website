/**
 * The Rockd API routes the editor writes to, as plain functions. The route
 * surface is the app's: `POST /protected/checkin` for a checkin and its
 * observations in one body, `POST /protected/photos` per photo, and
 * `POST /protected/checkin_delete/:id`. No new routes.
 */
import { rockdApiURL } from "~/settings";

export class RockdAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "RockdAPIError";
  }
}

interface Envelope<T> {
  success?: { v?: number; data: T };
  error?: { message?: string; status?: number } | string;
}

function apiURL(path: string, params: Record<string, string> = {}): string {
  const base = rockdApiURL.replace(/\/$/, "");
  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function unwrap<T>(response: Response): Promise<T> {
  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    // Fall through to the status-based message
  }
  if (!response.ok || body?.success == null) {
    let message = `Rockd request failed (${response.status})`;
    const error = body?.error;
    if (typeof error === "string") message = error;
    else if (error?.message != null) message = error.message;
    throw new RockdAPIError(response.status, message);
  }
  return body.success.data;
}

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

/** One checkin with its observations, as the signed-in user sees it (the
 * token lets a private checkin of theirs through). */
export async function fetchCheckin(
  checkinId: number | string,
  token: string | null,
  signal?: AbortSignal
): Promise<any | null> {
  const params: Record<string, string> = { checkin_id: String(checkinId) };
  if (token != null) params.token = token;
  const res = await fetch(apiURL("/protected/checkins", params), {
    signal,
    headers: { Accept: "application/json" },
  });
  const rows = await unwrap<any[]>(res);
  return rows?.[0] ?? null;
}

export interface CheckinSaveResult {
  checkin_id: number;
  stats?: unknown[];
  xp?: { total?: number; [key: string]: unknown };
  /** The photos the server allocated ids for, to upload next */
  photos: PhotoSlot[];
}

export interface PhotoSlot {
  type: "checkin" | "obs";
  /** The checkin or observation id the photo belongs to */
  id: number;
  /** The client's file name, matching the draft's `LocalPhoto.localId` */
  local_id: string;
}

export async function postCheckin(
  payload: object,
  signal?: AbortSignal
): Promise<CheckinSaveResult> {
  const res = await fetch(apiURL("/protected/checkin"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
    signal,
  });
  const data = await unwrap<CheckinSaveResult>(res);
  return { ...data, photos: data.photos ?? [] };
}

export async function postPhoto(
  slot: PhotoSlot,
  image: string,
  token: string,
  signal?: AbortSignal
): Promise<{ photo_id: number }> {
  const res = await fetch(apiURL("/protected/photos"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ type: slot.type, id: slot.id, image, token }),
    signal,
  });
  return await unwrap<{ photo_id: number }>(res);
}

export async function deleteCheckin(
  checkinId: number,
  token: string,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(
    apiURL(`/protected/checkin_delete/${checkinId}`, { token }),
    { method: "POST", headers: JSON_HEADERS, body: "[]", signal }
  );
  await unwrap<unknown>(res);
}

/** The organizations the signed-in user belongs to, for assigning a checkin */
export async function fetchMyOrganizations(
  token: string,
  signal?: AbortSignal
): Promise<{ id: number; name: string; role: string }[]> {
  const res = await fetch(apiURL("/protected/orgs", { token }), {
    signal,
    headers: { Accept: "application/json" },
  });
  return await unwrap<any[]>(res);
}

/** The nearest place name, as the server labels checkins (`near`) */
export async function fetchPlaceName(
  position: { lng: number; lat: number },
  signal?: AbortSignal
): Promise<string | null> {
  const res = await fetch(
    apiURL("/nearby", {
      lng: position.lng.toFixed(5),
      lat: position.lat.toFixed(5),
    }),
    { signal, headers: { Accept: "application/json" } }
  );
  const data = await unwrap<any>(res);
  if (typeof data === "string") return data;
  return data?.place ?? data?.[0]?.place ?? null;
}
