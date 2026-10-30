import h from "@macrostrat/hyper";
import { CheckinMapPage } from "~/components/map-sidebar";
import { MapCheckinFeed } from "~/components/checkin-feed";
import {
  clearRockdAuth,
  getStoredRockdToken,
  useRequiredRockdPersonId,
} from "~/components/auth";

/** The signed-in user's checkins, on the map and listed beside it */
export function Page() {
  const personId = useRequiredRockdPersonId();
  if (personId == null) return null;

  return h(CheckinMapPage, {
    title: "My checkins",
    personId,
    onLogout: logOut,
    // The token lets a non-public profile see its own checkins
    list: h(MapCheckinFeed, {
      feed: { feedType: "mine", personId, token: getStoredRockdToken() },
    }),
  });
}

function logOut() {
  clearRockdAuth();
  window.location.href = "/login";
}
