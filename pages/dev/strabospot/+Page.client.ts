import h from "@macrostrat/hyper";
import { Button, Callout } from "@blueprintjs/core";
import { CheckinMapPage } from "~/components/map-sidebar";
import { useEffect, useState } from "react";
import { FeatureDetails } from "./featured-checkins";
import {
  refreshStoredStrabospotAuth,
  clearStoredStrabospotAuth,
  loginAndRefreshStrabospotFromUUID,
  ROCKD_GREEN,
  STRABOSPOT_LOGO_URL,
} from "./strabospot-integration";
import { clearRockdAuth, useRequiredRockdPersonId } from "~/components/auth";

const strabospotSyncButtonBaseStyle = {
  // Squarer than a pill, still softly rounded
  borderRadius: "4px",
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
  // Linked: the Rockd icon's green
  synced: {
    ...strabospotSyncButtonBaseStyle,
    background: `linear-gradient(180deg, ${ROCKD_GREEN.light} 0%, ${ROCKD_GREEN.base} 100%)`,
    color: ROCKD_GREEN.ink,
    border: `1px solid ${ROCKD_GREEN.dark}`,
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
      src: STRABOSPOT_LOGO_URL,
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

// One link request per code, shared by every caller: StraboSpot honours a
// code once, so a second request with it would fail
const linkRequests = new Map<
  string,
  ReturnType<typeof loginAndRefreshStrabospotFromUUID>
>();

function linkWithCode(code: string) {
  let request = linkRequests.get(code);
  if (request == null) {
    request = loginAndRefreshStrabospotFromUUID(code);
    linkRequests.set(code, request);
  }
  return request;
}

/** The signed-in user's checkins, on the map and listed beside it, for sending
 * to StraboSpot */
export function Page() {
  const [isStrabospotSynced, setIsStrabospotSynced] = useState(false);
  const [isCheckingStrabospotSync, setIsCheckingStrabospotSync] =
    useState(true);
  const rockdPersonId = useRequiredRockdPersonId();

  const [linkError, setLinkError] = useState<string | null>(null);
  // StraboSpot's one-time `?u=` code, read once when the page mounts (the
  // effect below may run twice in development, and the URL loses it)
  const [linkCode] = useState(() =>
    new URLSearchParams(window.location.search).get("u")
  );

  useEffect(() => {
    let cancelled = false;
    async function checkStrabospotSync() {
      // The code works once: drop it from the URL whatever happens, so a
      // reload doesn't retry a spent code
      if (linkCode != null) {
        const cleanURL = `${window.location.origin}${window.location.pathname}`;
        window.history.replaceState({}, "", cleanURL);
      }
      try {
        if (linkCode != null) {
          const auth = await linkWithCode(linkCode);
          if (cancelled) return;

          const isFullyLinked =
            auth.accessToken != null &&
            auth.refreshToken != null &&
            auth.datasetId != null &&
            auth.projectId != null;

          setIsStrabospotSynced(isFullyLinked);
          return;
        }
        // A load only refreshes the login; setup runs when linking
        const ok = await refreshStoredStrabospotAuth();
        if (cancelled) return;
        setIsStrabospotSynced(ok);
      } catch (err: any) {
        console.error("Failed to complete StraboSpot login:", err);
        if (cancelled) return;
        setIsStrabospotSynced(false);
        setLinkError(err?.message ?? "Couldn't link to StraboSpot.");
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
    setLinkError(null);
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
    list: h([
      // Why linking didn't work, rather than a button that just stays unlinked
      h.if(linkError != null)(
        Callout,
        {
          key: "link-error",
          intent: "danger",
          icon: "error",
          title: "Couldn't link to StraboSpot",
          style: { marginBottom: "0.5rem", wordBreak: "break-word" },
        },
        linkError
      ),
      h(FeatureDetails, {
        key: "list",
        isStrabospotSynced,
        personId: rockdPersonId,
      }),
    ]),
  });
}

function logOut() {
  clearRockdAuth();
  clearStoredStrabospotAuth();
  window.location.href = "/login";
}
