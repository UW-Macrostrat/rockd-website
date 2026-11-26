import { rockdApiURL } from "~/settings";
import { OrganizationAPIError } from "./errors";
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationDetail,
  OrganizationMember,
  OrganizationMembership,
  OrganizationRole,
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

async function del<T>(
  path: string,
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<T> {
  const response = await fetch(apiURL(path, token), {
    method: "DELETE",
    signal: options.signal,
    headers: { Accept: "application/json" },
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

/** An organization's roster. Pass a token: an admin's request also returns the
 * people who have asked to join, and members whose Rockd profile is private. */
export function listOrganizationMembers(
  id: number | string,
  options: RequestOptions = {}
): Promise<OrganizationMember[]> {
  return get<OrganizationMember[]>(
    `/orgs/${encodeURIComponent(id)}/members`,
    options
  );
}

/** Ask to join. The row lands in "requested" and waits for an admin; nobody
 * joins by their own action. Harmless to call twice. */
export function requestMembership(
  id: number | string,
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<{ org_id: number; role: OrganizationRole }> {
  return post(`/protected/orgs/${encodeURIComponent(id)}/membership`, {}, token, options);
}

/** Leave, or withdraw a request that hasn't been approved. Refused for an
 * organization's last admin. */
export function leaveOrganization(
  id: number | string,
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<unknown> {
  return del(
    `/protected/orgs/${encodeURIComponent(id)}/membership`,
    token,
    options
  );
}

/** Admins only. Approving a request is `member`; `admin` promotes. */
export function setMemberRole(
  id: number | string,
  personId: number,
  role: "member" | "admin",
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<OrganizationMember> {
  return post(
    `/protected/orgs/${encodeURIComponent(id)}/members`,
    { person_id: personId, role },
    token,
    options
  );
}

/** Admins only. Removes the row — which is how a request is denied, and how a
 * member is taken off the roster. */
export function removeMember(
  id: number | string,
  personId: number,
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<unknown> {
  return del(
    `/protected/orgs/${encodeURIComponent(id)}/members/${personId}`,
    token,
    options
  );
}

/** Admins only. The organization's checkins are unassigned and its memberships
 * dropped; the checkins themselves stay in their authors' accounts. */
export function deleteOrganization(
  id: number | string,
  token: string,
  options: Pick<RequestOptions, "signal"> = {}
): Promise<Organization> {
  return del<Organization>(
    `/protected/orgs/${encodeURIComponent(id)}`,
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
