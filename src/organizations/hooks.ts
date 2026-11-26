import { useEffect, useState } from "react";
import {
  getOrganization,
  listMyOrganizations,
  listOrganizationMembers,
  listOrganizations,
} from "./api";
import type {
  OrganizationDetail,
  OrganizationMember,
  OrganizationMembership,
  OrganizationRole,
  OrganizationSummary,
} from "./types";

interface OrganizationsState {
  organizations: OrganizationSummary[] | null;
  error: Error | null;
  loading: boolean;
}

export function useOrganizations(refreshKey = 0): OrganizationsState {
  const [state, setState] = useState<OrganizationsState>({
    organizations: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState({ organizations: null, error: null, loading: true });

    listOrganizations({ signal: controller.signal })
      .then((organizations) => {
        setState({ organizations, error: null, loading: false });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ organizations: null, error, loading: false });
      });

    return () => controller.abort();
  }, [refreshKey]);

  return state;
}

/** The signed-in person's role in each organization they belong to, keyed by
 * organization id — what the directory needs to know which cards get the
 * admin-only controls. Empty when signed out, and empty rather than an error
 * if the lookup fails, so a sign-in problem can't take the directory down with
 * it: the worst case is that the controls don't appear. */
export function useMyOrganizationRoles(
  token: string | null,
  refreshKey = 0
): Map<number, OrganizationRole> {
  const [roles, setRoles] = useState(new Map<number, OrganizationRole>());

  useEffect(() => {
    if (token == null) {
      setRoles(new Map());
      return;
    }

    const controller = new AbortController();
    listMyOrganizations(token, { signal: controller.signal })
      .then((memberships) => {
        setRoles(new Map(memberships.map((m) => [m.id, m.role])));
      })
      .catch(() => setRoles(new Map()));

    return () => controller.abort();
  }, [token, refreshKey]);

  return roles;
}

interface OrganizationState {
  organization: OrganizationDetail | null;
  members: OrganizationMember[];
  error: Error | null;
  loading: boolean;
}

/** One organization and its roster, for the organization's own page.
 *
 * The token matters twice over: `GET /orgs/:id` uses it to report the caller's
 * own role (which is what decides between Join, Leave and the admin controls),
 * and the roster route uses it to include people who have asked to join, which
 * only that organization's admins may see. Signed out, both still work — the
 * role comes back null and the roster is just the public members. */
export function useOrganization(
  id: string | number | null,
  token: string | null,
  refreshKey = 0
): OrganizationState {
  const [state, setState] = useState<OrganizationState>({
    organization: null,
    members: [],
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (id == null) return;
    const controller = new AbortController();
    const signal = controller.signal;
    setState({ organization: null, members: [], error: null, loading: true });

    Promise.all([
      getOrganization(id, { signal, token }),
      // The roster is secondary — an organization that loads without it is
      // still worth showing, so a failure here is an empty list, not an error.
      listOrganizationMembers(id, { signal, token }).catch(() => []),
    ])
      .then(([organization, members]) => {
        setState({ organization, members, error: null, loading: false });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ organization: null, members: [], error, loading: false });
      });

    return () => controller.abort();
  }, [id, token, refreshKey]);

  return state;
}

/** Someone waiting on the signed-in person to approve them. */
export interface PendingRequest {
  organization: OrganizationMembership;
  member: OrganizationMember;
}

/**
 * Everyone waiting on the signed-in person, across every organization they
 * administer — the notification the profile page shows.
 *
 * Takes the caller's memberships rather than fetching them, since the hook
 * below needs that list anyway. From there it reads the roster of each
 * organization they administer: the API has no "every request across my orgs"
 * route, and this needs no new one; an admin belongs to few enough
 * organizations that the fan-out is cheap.
 */
async function fetchPendingRequests(
  memberships: OrganizationMembership[],
  token: string,
  signal: AbortSignal
): Promise<PendingRequest[]> {
  const administered = memberships.filter((m) => m.role === "admin");

  const rosters = await Promise.all(
    administered.map((organization) =>
      listOrganizationMembers(organization.id, { signal, token }).then(
        (members) => ({ organization, members })
      )
    )
  );

  const requests: PendingRequest[] = [];
  for (const { organization, members } of rosters) {
    for (const member of members) {
      if (member.role === "requested") requests.push({ organization, member });
    }
  }
  return requests;
}

interface MembershipsState {
  memberships: OrganizationMembership[];
  requests: PendingRequest[];
  error: Error | null;
  loading: boolean;
}

/** The profile page's organization section: what you belong to, and who is
 * waiting on you. Signed out it is simply empty. */
export function useMyMemberships(
  token: string | null,
  refreshKey = 0
): MembershipsState {
  const [state, setState] = useState<MembershipsState>({
    memberships: [],
    requests: [],
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (token == null) {
      setState({ memberships: [], requests: [], error: null, loading: false });
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    setState({ memberships: [], requests: [], error: null, loading: true });

    listMyOrganizations(token, { signal })
      .then(async (memberships) => {
        const requests = await fetchPendingRequests(
          memberships,
          token,
          signal
        );
        setState({ memberships, requests, error: null, loading: false });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setState({ memberships: [], requests: [], error, loading: false });
      });

    return () => controller.abort();
  }, [token, refreshKey]);

  return state;
}
