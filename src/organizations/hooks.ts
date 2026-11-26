import { useEffect, useState } from "react";
import { listMyOrganizations, listOrganizations } from "./api";
import type { OrganizationRole, OrganizationSummary } from "./types";

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
