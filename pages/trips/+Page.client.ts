import h from "@macrostrat/hyper";
import type { MapPosition } from "@macrostrat/mapbox-utils";
import { atom } from "jotai";
import { useMemo } from "react";
import { navigate } from "vike/client/router";
import {
  defaultMapPosition,
  MapPointClicks,
  type PointTarget,
  RememberMapPosition,
  RockdMapPage,
  useRememberedMapPosition,
} from "~/components/map-sidebar";
import {
  TripList,
  tripPointLayers,
  tripPointsStyle,
  type TripPoint,
  useRecentTrips,
  useTripPoints,
} from "~/components/trips";

// A stable empty, so the map's layers rebuild only when the trips arrive
const NO_POINTS: TripPoint[] = [];

// Where the map was left, so closing a trip returns to the same view
const mapPositionAtom = atom<MapPosition | null>(null);

// A trip picked on the map opens on its own page
const targets: PointTarget[] = [
  {
    layers: tripPointLayers,
    onPick: (feature) => navigate(`/trip/${feature.properties.trip_id}`),
  },
];
const ignoreMiss = () => {};

/** Every public trip as a clustered point on the map (at its first stop), and
 * the most recent listed beside it; a trip picked in either opens its page. */
export function Page() {
  const points = useTripPoints();
  const recentTrips = useRecentTrips();
  const mapPosition = useRememberedMapPosition(
    mapPositionAtom,
    defaultMapPosition
  );
  const layers = useMemo(
    () => tripPointsStyle(points ?? NO_POINTS),
    [points]
  );

  let description = "Loading trips…";
  if (points != null) {
    description = `Pick one of ${points.length} public trips on the map, or a recent one below.`;
  }

  return h(
    RockdMapPage,
    {
      title: "Trips",
      sidebar: h(TripList, {
        title: "Recent trips",
        description,
        trips: recentTrips,
      }),
      layers,
      mapPosition,
    },
    [
      h(MapPointClicks, { targets, onMiss: ignoreMiss }),
      h(RememberMapPosition, { positionAtom: mapPositionAtom }),
    ]
  );
}
