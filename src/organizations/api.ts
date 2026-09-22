import { rockdApiURL } from "~/settings";
import { OrganizationAPIError } from "./errors";
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationDetail,
  OrganizationMembership,
  OrganizationSummary,
  UpdateOrganizationInput,
} from "./types";

interface RequestOptions {
  signal?: AbortSignal;
  token?: string | null;
}

interface APIEnvelope<T> {
  success?: { v: number; data: T };
  error?: { message?: string };
}

function apiURL(path: string, token?: string | null): string {
  const base = rockdApiURL.replace(/\/$/, "");
  const url = new URL(`${base}${path}`);
  if (token != null) url.searchParams.set("token", token);
  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  let body: APIEnvelope<T> | null = null;
  try {
    body = (await response.json()) as APIEnvelope<T>;
  } catch {
    // The status-based fallback below is more useful than a JSON parse error.
  }

  if (!response.ok || body?.success == null) {
    const fallback = `Organization request failed (${response.status})`;
    let message = body?.error?.message ?? fallback;
    // The API currently exposes raw database text for some unexpected errors.
    if (response.status >= 500) message = fallback;
    throw new OrganizationAPIError(response.status, message);
  }

  return body.success.data;
}

async function get<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(apiURL(path, options.token), {
    signal: options.signal,
    headers: { Accept: "application/json" },
  });
  return await parseResponse<T>(response);
}

async function post<T, P extends object>(
  path: string,
  payload: P,
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<T> {
  const response = await fetch(apiURL(path), {
    method: "POST",
    signal: options.signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, token }),
  });
  return await parseResponse<T>(response);
}

export function listOrganizations(
  options: Pick<RequestOptions, "signal"> = {}
): Promise<OrganizationSummary[]> {
  return get<OrganizationSummary[]>("/orgs", options);
}

export function getOrganization(
  id: number | string,
  options: RequestOptions = {}
): Promise<OrganizationDetail> {
  return get<OrganizationDetail>(`/orgs/${encodeURIComponent(id)}`, options);
}

export function listMyOrganizations(
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<OrganizationMembership[]> {
  return get<OrganizationMembership[]>("/protected/orgs", {
    ...options,
    token,
  });
}

export function createOrganization(
  input: CreateOrganizationInput,
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<Organization> {
  return post<Organization, CreateOrganizationInput>(
    "/protected/orgs",
    input,
    token,
    options
  );
}

export function updateOrganization(
  id: number | string,
  changes: UpdateOrganizationInput,
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<Organization> {
  return post<Organization, UpdateOrganizationInput>(
    `/protected/orgs/${encodeURIComponent(id)}`,
    changes,
    token,
    options
  );
}
