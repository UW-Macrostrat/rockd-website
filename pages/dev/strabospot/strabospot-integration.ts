import { Button, Callout, Spinner } from "@blueprintjs/core";
import { useState } from "react";
import h from "@macrostrat/hyper";

const CONVERT_ENDPOINT =
  "https://dev.macrostrat.org/api/v3/dev/convert/field-site?in=checkin&out=spot";

const STRABOSPOT_LOGIN_ENDPOINT = "https://strabospot.org/jwtauth/login";
const STRABOSPOT_REFRESH_ENDPOINT = "https://strabospot.org/jwtauth/refresh";
const STORAGE_KEY = "strabospot-auth";
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

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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

function saveStoredStrabospotAuth(auth: StoredStrabospotAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
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

  const body = await jwtFetch(STRABOSPOT_CREATE_DATASET_ENDPOINT, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return body;
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

  const body = await jwtFetch(STRABOSPOT_CREATE_PROJECT_ENDPOINT, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return body;
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

export async function ensureRockdIntegrationResources(
  auth: StoredStrabospotAuth
): Promise<StoredStrabospotAuth> {
  const accessToken = auth.accessToken;

  const datasets = await getMyDatasets(accessToken);
  let dataset = datasets.find((d) => d?.name === "Rockd Checkins");

  if (dataset == null) {
    const createdDataset = await createDataset(
      accessToken,
      datasets.map((d) => Number(d.id)).filter((id) => Number.isFinite(id))
    );
    dataset = createdDataset;
  }

  const projects = await getMyProjects(accessToken);
  let project = projects.find((p) => p?.name === "Rockd Integration");

  if (project == null) {
    const createdProject = await createProject(
      accessToken,
      projects.map((p) => Number(p.id)).filter((id) => Number.isFinite(id))
    );
    project = createdProject;
  }

  // Tie them every login to guarantee linkage. If already linked, StraboSpot may
  // return an error or no-op depending on implementation; adjust later if needed.
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

export function getStoredStrabospotAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw == null) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredStrabospotAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
interface SendToStrabospotButtonProps {
  checkin: any;
}

export async function refreshStoredStrabospotAuth(): Promise<boolean> {
  const auth = getStoredStrabospotAuth();

  if (auth == null || auth.refreshToken == null) {
    return false;
  }

  try {
    const refresh = await refreshStrabospotToken(auth.refreshToken);

    const updatedAuth = {
      ...auth,
      accessToken: refresh.access_token,
      tokenType: refresh.token_type ?? auth.tokenType,
      expiresIn: refresh.expires_in ?? auth.expiresIn,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAuth));
    return true;
  } catch (err: any) {
    clearStoredStrabospotAuth();
    return false;
  }
}

export function getStrabospotAccessToken(): string | null {
  const auth = getStoredStrabospotAuth();
  return auth?.accessToken ?? null;
}

const sendToStrabospotButtonBaseStyle = {
  marginTop: "0.5rem",
  whiteSpace: "normal" as const,
  wordBreak: "break-word" as const,
  textAlign: "center" as const,
  lineHeight: 1.2,
  minHeight: "38px",
  height: "auto",
  padding: "8px 10px",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "12px",
  border: "1px solid transparent",
  transition: "all 120ms ease",
};

const sendToStrabospotButtonStyles = {
  default: {
    ...sendToStrabospotButtonBaseStyle,
  },
  sent: {
    ...sendToStrabospotButtonBaseStyle,
    background: "linear-gradient(180deg, #bfc6d2 0%, #a8b1bf 100%)",
    color: "#364152",
    border: "1px solid #8f99a8",
    boxShadow:
      "inset 0 2px 4px rgba(55,65,81,0.22), inset 0 -1px 0 rgba(255,255,255,0.35), 0 1px 0 rgba(255,255,255,0.2)",
    transform: "translateY(1px)",
  },
};

export function SendToStrabospotButton({
  checkin,
}: SendToStrabospotButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [responseBody, setResponseBody] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasSent, setWasSent] = useState(false);

  async function handleSend() {
    setIsLoading(true);
    setError(null);
    setResponseBody(null);
    setWasSent(false);

    try {
      const auth = getStoredStrabospotAuth();

      if (auth == null || auth.accessToken == null || auth.datasetId == null) {
        setError(
          "StraboSpot is not fully linked. Missing access token or dataset id."
        );
        return;
      }

      // Step 1: convert Rockd checkin -> StraboSpot spot GeoJSON
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
      } catch {
        // leave as raw text if parsing fails
      }

      if (!convertRes.ok) {
        setError(
          typeof convertedBody === "string"
            ? convertedBody
            : JSON.stringify(convertedBody, null, 2)
        );
        return;
      }

      // Step 2: post converted GeoJSON into datasetspots/{datasetId}
      const datasetSpotResponse = await postConvertedSpotToDataset(
        auth.accessToken,
        auth.datasetId,
        convertedBody
      );

      setResponseBody(datasetSpotResponse);
      setWasSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Request failed");
    } finally {
      setIsLoading(false);
    }
  }

  return h("div.strabospot-integration", [
    h(
      Button,
      {
        fill: true,
        loading: isLoading,
        onClick: handleSend,
        style: wasSent
          ? sendToStrabospotButtonStyles.sent
          : sendToStrabospotButtonStyles.default,
      },
      wasSent ? "Sent to Strabospot" : "Send to Strabospot"
    ),

    h.if(isLoading)(
      "div",
      { style: { marginTop: "0.5rem" } },
      h(Spinner, { size: 18 })
    ),

    h.if(error != null)(
      "div",
      { style: { marginTop: "0.5rem" } },
      h(
        Callout,
        { intent: "danger", title: "Conversion failed" },
        h(
          "pre",
          {
            style: {
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              margin: 0,
            },
          },
          error
        )
      )
    ),

    h.if(responseBody != null)(
      "div",
      { style: { marginTop: "0.5rem" } },
      h(
        Callout,
        { intent: "success", title: "Success! Sent to Strabospot:" },
        h(
          "pre",
          {
            style: {
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              margin: 0,
              maxHeight: "240px",
            },
          },
          typeof responseBody === "string"
            ? responseBody
            : JSON.stringify(responseBody, null, 2)
        )
      )
    ),
  ]);
}
