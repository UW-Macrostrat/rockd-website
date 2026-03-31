import { macrostratApiURL } from "~/settings";

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

const STORAGE_KEY = "strabospot-auth";
const SENT_TO_STRABOSPOT_KEY = "sent-to-strabospot";

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

async function getDatasetSpots(accessToken: string, datasetId: number) {
  return await jwtFetch(
    `https://strabospot.org/jwtdb/datasetSpots/${datasetId}`,
    accessToken
  );
}

function setSentToStrabospotIds(ids: number[]) {
  localStorage.setItem(
    SENT_TO_STRABOSPOT_KEY,
    JSON.stringify(ids.filter((id) => Number.isFinite(id)))
  );
}

export async function hydrateSentToStrabospotIds(auth: StoredStrabospotAuth) {
  if (auth.accessToken == null || auth.datasetId == null) return;
  const datasetBody = await getDatasetSpots(auth.accessToken, auth.datasetId);
  const features = Array.isArray(datasetBody?.features)
    ? datasetBody.features
    : [];
  const ids = features
    .map((feature) => Number(feature?.properties?.id))
    .filter((id) => Number.isFinite(id));
  setSentToStrabospotIds(ids);
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
  try {
    await hydrateSentToStrabospotIds(enrichedAuth);
  } catch (err) {
    console.warn("Failed to hydrate sent-to-strabospot ids", err);
  }
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
  localStorage.removeItem(SENT_TO_STRABOSPOT_KEY);
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

export function getSentToStrabospotIds(): Set<number> {
  const raw = localStorage.getItem(SENT_TO_STRABOSPOT_KEY);
  if (raw == null) return new Set<number>();

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<number>();
    return new Set(
      parsed.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    );
  } catch {
    return new Set<number>();
  }
}

export function addSentToStrabospotId(checkinId: number) {
  const current = getSentToStrabospotIds();
  current.add(Number(checkinId));
  localStorage.setItem(
    SENT_TO_STRABOSPOT_KEY,
    JSON.stringify(Array.from(current))
  );
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

  return convertedBody;
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

  const successes: number[] = [];

  for (const checkin of checkins) {
    const checkinId = Number(checkin?.checkin_id ?? checkin?.id);

    if (!Number.isFinite(checkinId)) {
      throw new Error("Encountered a checkin without a valid checkin_id.");
    }

    const convertedBody = await convertSingleCheckinToSpot(checkin);

    const postResult = await postConvertedSpotToDatasetSingle(
      auth.accessToken,
      auth.datasetId,
      convertedBody
    );

    if (postResult.status === 200) {
      addSentToStrabospotId(checkinId);
      successes.push(checkinId);
    }
  }

  return {
    success: true,
    sentCheckinIds: successes,
  };
}
