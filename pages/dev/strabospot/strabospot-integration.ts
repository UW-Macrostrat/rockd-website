import { macrostratApiURL, SETTINGS } from "~/settings";

const CONVERT_ENDPOINT = `${macrostratApiURL}/api/v3/dev/convert/field-site?in=checkin&out=spot&bulk=false`;

const STRABOSPOT_LOGIN_ENDPOINT = "https://strabospot.org/jwtauth/login";
const STRABOSPOT_REFRESH_ENDPOINT = "https://strabospot.org/jwtauth/refresh";
const STRABOSPOT_MY_DATASETS_ENDPOINT =
  "https://strabospot.org/jwtdb/myDatasets";
const STRABOSPOT_MY_PROJECTS_ENDPOINT =
  "https://strabospot.org/jwtdb/myProjects";
const STRABOSPOT_CREATE_DATASET_ENDPOINT =
  "https://strabospot.org/jwtdb/dataset";
const STRABOSPOT_CREATE_PROJECT_ENDPOINT =
  "https://strabospot.org/jwtdb/project";
const STRABOSPOT_IMAGE_ENDPOINT = "https://strabospot.org/jwtdb/image";
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

function getUnixSecondsNow() {
  return Math.floor(Date.now() / 1000);
}

function formatDateMMDDYYYY(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

function formatDateYYYYMMDD(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${yyyy}-${mm}-${dd}`;
}

function generateUniqueNumericId(existingIds: number[]) {
  let candidate = parseInt(
    `${Math.floor(Date.now() / 1000)}${Math.floor(1000 + Math.random() * 9000)}`
  );
  while (existingIds.includes(candidate)) {
    candidate = parseInt(
      `${Math.floor(Date.now() / 1000)}${Math.floor(
        1000 + Math.random() * 9000
      )}`
    );
  }
  return candidate;
}

async function jwtFetch(
  url: string,
  accessToken: string,
  init: RequestInit = {}
) {
  const headers = {
    Accept: "*/*",
    Authorization: `Bearer ${accessToken}`,
    ...(init.body != null ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  const res = await fetch(url, { ...init, headers });
  const body = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }

  return body;
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

async function getMyDatasets(accessToken: string) {
  const body = await jwtFetch(STRABOSPOT_MY_DATASETS_ENDPOINT, accessToken);
  return body?.datasets ?? [];
}

async function getMyProjects(accessToken: string) {
  const body = await jwtFetch(STRABOSPOT_MY_PROJECTS_ENDPOINT, accessToken);
  return body?.projects ?? [];
}

async function createDataset(
  accessToken: string,
  existingDatasetIds: number[]
) {
  const id = generateUniqueNumericId(existingDatasetIds);
  const payload = {
    id,
    name: "Rockd Checkins",
    modified_timestamp: getUnixSecondsNow(),
    date: formatDateMMDDYYYY(),
  };

  return await jwtFetch(STRABOSPOT_CREATE_DATASET_ENDPOINT, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function createProject(
  accessToken: string,
  existingProjectIds: number[]
) {
  const id = generateUniqueNumericId(existingProjectIds);
  const today = new Date();

  const payload = {
    id,
    description: {
      project_name: "Rockd Integration",
      start_date: formatDateYYYYMMDD(today),
      end_date: "",
      purpose_of_study: "Syncing Rockd checkins as a spot",
      other_team_members: "",
      area_of_interest: "",
      spot_prefix: "TST",
      starting_number_for_spot: "1",
      sample_prefix: "S",
      instruments: "",
      gps_datum: "WGS84",
      magnetic_declination: "",
      Notes: "Created via Rock integration",
    },
    daily_setup: {},
    rock_units: [],
    preferences: {
      orientation: false,
      _3dstructures: false,
      images: false,
      sample: false,
      inferences: false,
      nesting: false,
      right_hand_rule: false,
      drop_down_to_finish: false,
      student_mode: false,
    },
    reports: null,
  };

  return await jwtFetch(STRABOSPOT_CREATE_PROJECT_ENDPOINT, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function addDatasetToProject(
  accessToken: string,
  projectId: number,
  datasetId: number
) {
  return await jwtFetch(
    `https://strabospot.org/jwtdb/projectDatasets/${projectId}`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ id: datasetId }),
    }
  );
}

export async function ensureRockdIntegrationResources(
  auth: StoredStrabospotAuth
): Promise<StoredStrabospotAuth> {
  const accessToken = auth.accessToken;

  const datasets = await getMyDatasets(accessToken);
  let dataset = datasets.find((d) => d?.name === "Rockd Checkins");

  if (dataset == null) {
    dataset = await createDataset(
      accessToken,
      datasets.map((d) => Number(d.id)).filter((id) => Number.isFinite(id))
    );
  }

  const projects = await getMyProjects(accessToken);
  let project = projects.find((p) => p?.name === "Rockd Integration");

  if (project == null) {
    project = await createProject(
      accessToken,
      projects.map((p) => Number(p.id)).filter((id) => Number.isFinite(id))
    );
  }

  await addDatasetToProject(
    accessToken,
    Number(project.id),
    Number(dataset.id)
  );

  const updatedAuth: StoredStrabospotAuth = {
    ...auth,
    datasetId: Number(dataset.id),
    projectId: Number(project.id),
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
  // Ensure dataset/project exist in StraboSpot — no longer hydrates sent IDs
  // from StraboSpot; sent status is now read from spot_id on the checkin record.
  return await ensureRockdIntegrationResources(auth);
}

export async function loginToStrabospotWithUUID(uuid: string) {
  const url = new URL(STRABOSPOT_ROCKD_LOGIN_ENDPOINT);
  url.searchParams.set("u", uuid);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
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
  const auth = getStoredStrabospotAuth();
  return auth?.datasetId ?? null;
}

export function getStrabospotProjectId(): number | null {
  const auth = getStoredStrabospotAuth();
  return auth?.projectId ?? null;
}

export function clearStoredStrabospotAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function refreshStoredStrabospotAuth(): Promise<boolean> {
  const auth = getStoredStrabospotAuth();

  if (auth == null || auth.refreshToken == null) {
    return false;
  }

  try {
    const refresh = await refreshStrabospotToken(auth.refreshToken);

    const updatedAuth: StoredStrabospotAuth = {
      ...auth,
      accessToken: refresh.access_token,
      tokenType: refresh.token_type ?? auth.tokenType,
      expiresIn: refresh.expires_in ?? auth.expiresIn,
    };

    saveStoredStrabospotAuth(updatedAuth);
    return true;
  } catch {
    clearStoredStrabospotAuth();
    return false;
  }
}

export function getStrabospotAccessToken(): string | null {
  const auth = getStoredStrabospotAuth();
  return auth?.accessToken ?? null;
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

async function convertSingleCheckinToSpot(checkin: any) {
  const convertRes = await fetch(CONVERT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkin),
  });

  const convertText = await convertRes.text();

  let convertedBody: any = convertText;
  try {
    convertedBody = JSON.parse(convertText);
  } catch {}

  if (!convertRes.ok) {
    throw new Error(
      typeof convertedBody === "string"
        ? convertedBody
        : JSON.stringify(convertedBody, null, 2)
    );
  }

  return convertedBody;
}

async function fetchRockdPhotoBlob(
  rockdToken: string,
  personId: number,
  photoId: number
) {
  const res = await fetch(
    `${SETTINGS.rockdApiURL}/protected/image/${personId}/banner/${photoId}`,
    {
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${rockdToken}`,
      },
      redirect: "follow",
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch Rockd photo ${photoId} for person ${personId}: ${errText}`
    );
  }
  return await res.blob();
}

async function uploadPhotoToStrabospot(
  accessToken: string,
  photoId: number,
  imageBlob: Blob
) {
  const formData = new FormData();
  formData.append("id", String(photoId));
  formData.append("modified_timestamp", String(Math.floor(Date.now() / 1000)));
  formData.append("image_file", imageBlob, `${photoId}.jpg`);
  const res = await fetch(STRABOSPOT_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "*/*",
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });
  const body = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(
      typeof body === "string" ? body : JSON.stringify(body, null, 2)
    );
  }
  return body;
}

/**
 * Sends checkins to the user's StraboSpot dataset and, for each successful
 * post (HTTP 200), persists spot_id to the Rockd database via
 * post /protected/checkin-spot. Requires the caller to supply the Rockd
 * auth token so the protected route accepts the request.
 *
 * spot_id == checkin_id for now; both sides can evolve this independently.
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
  if (checkins.length === 0) {
    throw new Error("No checkins selected.");
  }
  const successes: number[] = [];
  const imageFailedCheckinIds: number[] = [];
  const failedCheckins: Array<{ checkinId: number; message: string }> = [];
  for (const checkin of checkins) {
    const checkinId = Number(checkin?.checkin_id ?? checkin?.id);
    const personId = Number(checkin?.person_id);
    const photoId = checkin?.photo == null ? null : Number(checkin.photo);
    if (!Number.isFinite(checkinId)) {
      failedCheckins.push({
        checkinId: -1,
        message: "Encountered a checkin without a valid checkin_id.",
      });
      continue;
    }
    try {
      const convertedBody = await convertSingleCheckinToSpot(checkin);
      const postResult = await postConvertedSpotToDatasetSingle(
        auth.accessToken,
        auth.datasetId,
        convertedBody
      );
      if (postResult.status === 200) {
        if (
          photoId != null &&
          Number.isFinite(photoId) &&
          Number.isFinite(personId)
        ) {
          try {
            const imageBlob = await fetchRockdPhotoBlob(
              rockdToken,
              personId,
              photoId
            );
            await uploadPhotoToStrabospot(auth.accessToken, photoId, imageBlob);
          } catch (err: any) {
            console.error(
              `Photo upload failed for checkin ${checkinId}, photo ${photoId}:`,
              err
            );
            imageFailedCheckinIds.push(checkinId);
          }
        }
        const postResp = await fetch(
          `${SETTINGS.rockdApiURL}/protected/checkin-spot`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              checkin_id: checkinId,
              spot_id: checkinId,
              token: rockdToken,
            }),
          }
        );
        if (!postResp.ok) {
          const errText = await postResp.text().catch(() => "");
          throw new Error(
            `StraboSpot post succeeded but failed to save spot_id for checkin ${checkinId}: ${errText}`
          );
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
