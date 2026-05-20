import { macrostratApiURL, SETTINGS } from "~/settings";

const CONVERT_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/field-site?in=checkin&out=spot&bulk=false`;
const STRABOSPOT_SETUP_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/strabospot-setup`;
const CONVERT_IMAGE_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/image`;

const STRABOSPOT_LOGIN_ENDPOINT = "https://strabospot.org/jwtauth/login";
const STRABOSPOT_REFRESH_ENDPOINT = "https://strabospot.org/jwtauth/refresh";
const STORAGE_KEY = "strabospot-auth";
const STRABOSPOT_ROCKD_LOGIN_ENDPOINT = "https://strabospot.org/rockd_login";

export interface StrabospotLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: {
    pkey: string;
    email: string;
    name: string;
  };
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
  user?: {
    pkey: string;
    email: string;
    name: string;
  };
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

export async function loginToStrabospot(email: string, password: string) {
  const res = await fetch(STRABOSPOT_LOGIN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ email, password }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }
  return body as StrabospotLoginResponse;
}

export async function refreshStrabospotToken(refreshToken: string) {
  const res = await fetch(STRABOSPOT_REFRESH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }
  return body as StrabospotRefreshResponse;
}

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
  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }
  const updatedAuth: StoredStrabospotAuth = {
    ...auth,
    datasetId: body.dataset_id,
    projectId: body.project_id,
  };
  saveStoredStrabospotAuth(updatedAuth);
  return updatedAuth;
}

export async function loginAndRefreshStrabospot(
  email: string,
  password: string
) {
  const login = await loginToStrabospot(email, password);
  const refresh = await refreshStrabospotToken(login.refresh_token);
  const auth: StoredStrabospotAuth = {
    accessToken: refresh.access_token,
    refreshToken: login.refresh_token,
    tokenType: refresh.token_type ?? login.token_type,
    expiresIn: refresh.expires_in ?? login.expires_in,
    user: login.user,
  };
  saveStoredStrabospotAuth(auth);
  return await ensureRockdIntegrationResources(auth);
}

export async function loginToStrabospotWithUUID(uuid: string) {
  const url = new URL(STRABOSPOT_ROCKD_LOGIN_ENDPOINT);
  url.searchParams.set("u", uuid);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "*/*" },
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }
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

export function getStrabospotProjectId(): number | null {
  return getStoredStrabospotAuth()?.projectId ?? null;
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

export function getStrabospotAccessToken(): string | null {
  return getStoredStrabospotAuth()?.accessToken ?? null;
}

async function convertSingleCheckinToSpot(checkin: any) {
  const res = await fetch(CONVERT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkin),
  });
  const text = await res.text();
  let body: any = text;
  try {
    body = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }
  return body;
}

async function postConvertedSpotToDatasetSingle(
  accessToken: string,
  datasetId: number,
  convertedBody: any
) {
  const res = await fetch(
    `https://strabospot.org/jwtdb/datasetsinglespot/${datasetId}`,
    {
      method: "POST",
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(convertedBody),
    }
  );
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }
  return { status: res.status, body };
}

/**
 * After a successful spot post (HTTP 200), calls the /dev/convert/image API
 * which handles fetching the image from Rockd and uploading it to StraboSpot.
 */
async function syncCheckinImage(
  checkinId: number,
  straboToken: string,
  rockdToken: string
): Promise<{
  success: boolean;
  photo_uploaded: boolean;
  imageFailedCheckinId?: number;
}> {
  const res = await fetch(CONVERT_IMAGE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      checkin_id: checkinId,
      strabo_token: straboToken,
      rockd_token: rockdToken,
      spot_id: checkinId,
    }),
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    // Image sync failure is non-fatal — caller decides how to handle it
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }
  return body;
}

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

  const successes: number[] = [];
  const imageFailedCheckinIds: number[] = [];
  const failedCheckins: Array<{ checkinId: number; message: string }> = [];

  for (const checkin of checkins) {
    const checkinId = Number(checkin?.checkin_id ?? checkin?.id);
    const photoId = checkin?.photo == null ? null : Number(checkin.photo);

    if (!Number.isFinite(checkinId)) {
      failedCheckins.push({
        checkinId: -1,
        message: "Encountered a checkin without a valid checkin_id.",
      });
      continue;
    }

    try {
      //Convert checkin → StraboSpot spot format
      const convertedBody = await convertSingleCheckinToSpot(checkin);

      //Post converted spot to StraboSpot dataset
      const postResult = await postConvertedSpotToDatasetSingle(
        auth.accessToken,
        auth.datasetId,
        convertedBody
      );

      if (postResult.status === 200) {
        //On success, call the API to sync image + save spot_id to Rockd
        // (API handles Rockd fetch, S3 redirect, StraboSpot upload, and checkin-spot save)
        if (photoId != null && Number.isFinite(photoId)) {
          try {
            await syncCheckinImage(checkinId, auth.accessToken, rockdToken);
          } catch (err: any) {
            console.error(`Image sync failed for checkin ${checkinId}:`, err);
            imageFailedCheckinIds.push(checkinId);
          }
        }

        successes.push(checkinId);
      }
    } catch (err: any) {
      failedCheckins.push({
        checkinId,
        message: err?.message ?? `Failed to sync checkin ${checkinId}.`,
      });
    }
  }

  return {
    success: failedCheckins.length === 0,
    sentCheckinIds: successes,
    imageFailedCheckinIds,
    failedCheckins,
  };
}
