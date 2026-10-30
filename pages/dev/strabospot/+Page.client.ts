import h from "@macrostrat/hyper";
import { Button } from "@blueprintjs/core";
import { CheckinMapPage } from "~/components/map-sidebar";
import { useEffect, useState } from "react";
import { FeatureDetails } from "./featured-checkins";
import {
  refreshStoredStrabospotAuth,
  clearStoredStrabospotAuth,
  loginAndRefreshStrabospotFromUUID,
} from "./strabospot-integration";
import {
  clearRockdAuth,
  useRequiredRockdPersonId,
} from "../../login/rockd-auth";

const strabospotSyncButtonBaseStyle = {
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "12px",
  letterSpacing: "0.01em",
  padding: "0 6px",
  height: "23px",
  minHeight: "23px",
  lineHeight: "1",
  border: "1px solid transparent",
  transition: "all 120ms ease",
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
};

const strabospotSyncButtonStyles = {
  checking: {
    ...strabospotSyncButtonBaseStyle,
    background: "transparent",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    boxShadow: "none",
    cursor: "default",
  },
  synced: {
    ...strabospotSyncButtonBaseStyle,
    background: "linear-gradient(180deg, #7ee08f 0%, #43b864 100%)",
    color: "#2f6a41",
    border: "1px solid #379654",
    boxShadow:
      "inset 0 2px 4px rgba(16,53,29,0.2), inset 0 -1px 0 rgba(255,255,255,0.35), 0 1px 0 rgba(255,255,255,0.2)",
    transform: "translateY(1px)",
  },
  unsynced: {
    ...strabospotSyncButtonBaseStyle,
    background: "transparent",
    color: "inherit",
    border: "1px solid currentColor",
    boxShadow: "none",
  },
};

const strabospotBadgeImageStyle = {
  width: "22px",
  height: "22px",
  borderRadius: "4px",
  objectFit: "cover" as const,
  display: "block",
};

const strabospotSyncControlStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

/** The StraboSpot icon and its link/unlink button, in the sidebar header. */
function StrabospotLinkControl({
  isSynced,
  isChecking,
  onToggle,
}: {
  isSynced: boolean;
  isChecking: boolean;
  onToggle: () => void;
}) {
  let style = strabospotSyncButtonStyles.unsynced;
  let label = "Link to Strabospot";
  if (isChecking) {
    style = strabospotSyncButtonStyles.checking;
    label = "Checking...";
  } else if (isSynced) {
    style = strabospotSyncButtonStyles.synced;
    label = "Linked";
  }

  return h("div", { style: strabospotSyncControlStyle }, [
    h("img", {
      src: "https://strabospot.org/includes/mimages/pic01.jpg",
      alt: "StraboSpot",
      style: strabospotBadgeImageStyle,
    }),
    h(
      Button,
      {
        minimal: false,
        outlined: false,
        onClick: onToggle,
        disabled: isChecking,
        style,
      },
      label
    ),
  ]);
}

/** The signed-in user's checkins, on the map and listed beside it, for sending
 * to StraboSpot */
export function Page() {
  const [isStrabospotSynced, setIsStrabospotSynced] = useState(false);
  const [isCheckingStrabospotSync, setIsCheckingStrabospotSync] =
    useState(true);
  const rockdPersonId = useRequiredRockdPersonId();

  useEffect(() => {
    let cancelled = false;
    async function checkStrabospotSync() {
      try {
        const uuid = new URLSearchParams(window.location.search).get("u");
        if (uuid != null) {
          const auth = await loginAndRefreshStrabospotFromUUID(uuid);
          if (cancelled) return;

          const isFullyLinked =
            auth.accessToken != null &&
            auth.refreshToken != null &&
            auth.datasetId != null &&
            auth.projectId != null;

          setIsStrabospotSynced(isFullyLinked);

          const cleanURL = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, "", cleanURL);

          return;
        }
        const ok = await refreshStoredStrabospotAuth();
        if (cancelled) return;
        setIsStrabospotSynced(ok);
      } catch (err: any) {
        console.error("Failed to complete StraboSpot login:", err);
        console.error("Message:", err?.message);

        if (cancelled) return;

        setIsStrabospotSynced(false);
      } finally {
        if (!cancelled) {
          setIsCheckingStrabospotSync(false);
        }
      }
    }
    checkStrabospotSync();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggleStrabospotSync() {
    if (isStrabospotSynced) {
      clearStoredStrabospotAuth();
      setIsStrabospotSynced(false);
      return;
    }
    const strabospotLoginURL = new URL("https://strabospot.org/rockd_login");
    window.location.href = strabospotLoginURL.toString();
  }

  if (rockdPersonId == null) return null;

  return h(CheckinMapPage, {
    title: "My checkins",
    personId: rockdPersonId,
    onLogout: logOut,
    tools: h(StrabospotLinkControl, {
      isSynced: isStrabospotSynced,
      isChecking: isCheckingStrabospotSync,
      onToggle: handleToggleStrabospotSync,
    }),
    list: h(FeatureDetails, {
      isStrabospotSynced,
      personId: rockdPersonId,
    }),
  });
}

function logOut() {
  clearRockdAuth();
  clearStoredStrabospotAuth();
  window.location.href = "/login";
}
