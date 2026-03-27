import { useState } from "react";
import h from "@macrostrat/hyper";

const CONVERT_ENDPOINT =
  "https://dev.macrostrat.org/api/v3/dev/convert/field-site?in=checkin&out=spot";

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

const STORAGE_KEY = "strabospot-auth";

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
  let candidate = Date.now();
  while (existingIds.includes(candidate)) {
    candidate += 1;
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

  const res = await fetch(url, {
    ...init,
    headers,
  });

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
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
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
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
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

  const enrichedAuth = await ensureRockdIntegrationResources(auth);
  return enrichedAuth;
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

export async function getDatasetSpots(accessToken: string, datasetId: number) {
  return await jwtFetch(
    `https://strabospot.org/jwtdb/datasetSpots/${datasetId}`,
    accessToken
  );
}

export async function getDatasetSpotIds(): Promise<Set<number>> {
  const auth = getStoredStrabospotAuth();
  if (auth == null || auth.accessToken == null || auth.datasetId == null) {
    return new Set();
  }
  const datasetBody = await getDatasetSpots(auth.accessToken, auth.datasetId);
  const features = Array.isArray(datasetBody?.features)
    ? datasetBody.features
    : [];
  const ids = features
    .map((feature) => Number(feature?.properties?.id))
    .filter((id) => Number.isFinite(id));
  return new Set(ids);
}

async function postConvertedSpotToDataset(
  accessToken: string,
  datasetId: number,
  convertedBody: any
) {
  return await jwtFetch(
    `https://strabospot.org/jwtdb/datasetspots/${datasetId}`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(convertedBody),
    }
  );
}

export async function sendCheckinsToStrabospotDataset(checkins: any[]) {
  const auth = getStoredStrabospotAuth();

  if (auth == null || auth.accessToken == null || auth.datasetId == null) {
    throw new Error(
      "StraboSpot is not fully linked. Missing access token or dataset id."
    );
  }

  if (checkins.length === 0) {
    throw new Error("No checkins selected.");
  }

  const convertedCollections = [];

  for (const checkin of checkins) {
    const convertRes = await fetch(CONVERT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    if (
      convertedBody == null ||
      convertedBody.type !== "FeatureCollection" ||
      !Array.isArray(convertedBody.features)
    ) {
      throw new Error(
        "Converted checkin was not returned as a valid FeatureCollection."
      );
    }

    convertedCollections.push(convertedBody);
  }

  const existingDatasetBody = await getDatasetSpots(
    auth.accessToken,
    auth.datasetId
  );

  const mergedNewFeatures = convertedCollections.flatMap((fc) =>
    Array.isArray(fc.features) ? fc.features : []
  );

  const existingFeatures = Array.isArray(existingDatasetBody?.features)
    ? existingDatasetBody.features
    : [];

  const existingIds = new Set(
    existingFeatures
      .map((feature) => Number(feature?.properties?.id))
      .filter((id) => Number.isFinite(id))
  );

  const dedupedNewFeatures = mergedNewFeatures.filter((feature) => {
    const id = Number(feature?.properties?.id);
    return !Number.isFinite(id) || !existingIds.has(id);
  });

  const mergedDatasetBody = {
    type: "FeatureCollection",
    features: [...existingFeatures, ...dedupedNewFeatures],
  };

  return await postConvertedSpotToDataset(
    auth.accessToken,
    auth.datasetId,
    mergedDatasetBody
  );
}
