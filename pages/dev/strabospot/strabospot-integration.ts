import { macrostratApiURL } from "~/settings";

const STRABOSPOT_SETUP_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/strabospot-setup`;
const SYNC_CHECKINS_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/sync-checkins-to-strabo`;

const STRABOSPOT_REFRESH_ENDPOINT = "https://strabospot.org/jwtauth/refresh";
const STORAGE_KEY = "strabospot-auth";
const STRABOSPOT_ROCKD_LOGIN_ENDPOINT = "https://strabospot.org/rockd_login";

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
