import h from "@macrostrat/hyper";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import type { MapPosition } from "@macrostrat/mapbox-utils";
import { navigate } from "vike/client/router";
import {
  MapPointClicks,
  type PointTarget,
  RockdMapPage,
} from "~/components/map-sidebar";
import {
  inTripOrder,
  TripComments,
  TripDetails,
  tripRouteStyle,
  tripStopLayers,
  TripStopsOnMap,
} from "~/components/trips";

/**
 * A trip: its stops on the map, joined in order by a dotted line, and the
 * trip's details and stops in the sidebar. A stop picked on the map is pinned
 * and scrolled to; closing the trip returns to every trip (/trips).
 */
export function Trips({ data, commentsData }) {
  const [showComments, setShowComments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const trip = useMemo(
    () => ({ ...data, stops: inTripOrder(data.stops) }),
    [data]
  );
  const layers = useMemo(() => tripRouteStyle(trip.stops), [trip]);

  // A stop picked on the map shows in the trip's own view
  const pickStop = useCallback((checkinId: number | null) => {
    setSelectedStopId(checkinId);
    if (checkinId == null) return;
    setShowComments(false);
    setShowSettings(false);
  }, []);
  const clearStop = useCallback(() => pickStop(null), [pickStop]);
  const targets: PointTarget[] = useMemo(
    () => [
      {
        layers: tripStopLayers,
        onPick: (feature) => pickStop(feature.properties.checkin_id),
      },
    ],
    [pickStop]
  );

  let title = "Trips";
  let sidebar: ReactNode = h(TripDetails, {
    trip,
    selectedStopId,
    comments: commentsData,
    onShowComments: () => setShowComments(true),
  });
  let onClose: () => void = () => navigate("/trips");
  if (showComments) {
    title = "Comments";
    onClose = () => setShowComments(false);
    sidebar = h(TripComments, { comments: commentsData });
  }

  const start = trip.stops[0].checkin;
  const mapPosition: MapPosition = {
    camera: { lat: start.lat, lng: start.lng, altitude: 300000 },
  };

  return h(
    RockdMapPage,
    {
      title,
      sidebar,
      onClose,
      layers,
      mapPosition,
      showSettings,
      onShowSettings: setShowSettings,
    },
    [
      h(TripStopsOnMap, { stops: trip.stops, selectedStopId }),
      h(MapPointClicks, { targets, onMiss: clearStop }),
    ]
  );
}
