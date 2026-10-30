import h from "@macrostrat/hyper";
import { CheckinMapPage } from "~/components/map-sidebar";
import { MapCheckinFeed } from "~/components/checkin-feed";

/** Every public checkin on the map, with the checkins in view listed beside it */
export function Page() {
  return h(CheckinMapPage, {
    title: "Featured checkins",
    list: h(MapCheckinFeed, { feed: { feedType: "all" }, followMap: true }),
  });
}
