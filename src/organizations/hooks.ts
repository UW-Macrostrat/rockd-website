import { useEffect, useState } from "react";
import { listOrganizations } from "./api";
import type { OrganizationSummary } from "./types";

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
