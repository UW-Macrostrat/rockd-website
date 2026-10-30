import { type ReactNode, useMemo } from "react";
import type mapboxgl from "mapbox-gl";
import h from "@macrostrat/hyper";
import { useRockdAPI } from "~/components";
import {
  bluePoints,
  clusteredPointsStyle,
  FitBounds,
  pointLayers,
  type PointLayers,
  SelectedPin,
} from "~/components/map-sidebar";

const TRIP_STOPS = "trip-stops";
const TRIP_ROUTE = "trip-route";
const TRIP_POINTS = "trip-points";

/** A trip's stops on the map, each its own point */
export const tripStopLayers: PointLayers = { points: `${TRIP_STOPS}-points` };
/** Every public trip on the map, one point each */
export const tripPointLayers = pointLayers(TRIP_POINTS);

/** Stops with a located checkin; others can't go on the map */
function locatedStops(stops) {
  return stops.filter((stop) => stop.checkin?.lng != null);
}

function stopPosition(stop): [number, number] {
  return [stop.checkin.lng, stop.checkin.lat];
}

/** A trip's stops in the order the trip visits them */
export function inTripOrder(stops) {
  return [...stops].sort((a, b) => a.trip_order - b.trip_order);
}

/**
 * A trip's route: each stop its own point (never clustered), joined in the
 * order given by a dotted line, in blue so it stands apart from the overlay.
 */
export function tripRouteStyle(stops): mapboxgl.Style {
  const located = locatedStops(stops);
  const points = located.map((stop) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: stopPosition(stop) },
    properties: { checkin_id: stop.checkin.checkin_id },
  }));
  const route = {
    type: "Feature",
    geometry: { type: "LineString", coordinates: located.map(stopPosition) },
    properties: {},
  };

  return {
    sources: {
      [TRIP_STOPS]: {
        type: "geojson",
        data: { type: "FeatureCollection", features: points },
      },
      [TRIP_ROUTE]: { type: "geojson", data: route },
    },
    layers: [
      {
        id: TRIP_ROUTE,
        type: "line",
        source: TRIP_ROUTE,
        layout: { "line-cap": "round", "line-join": "round" },
        // Zero-length dashes with round caps draw dots
        paint: {
          "line-color": bluePoints.point,
          "line-width": 3,
          "line-dasharray": [0, 2],
        },
      },
      {
        id: tripStopLayers.points,
        type: "circle",
        source: TRIP_STOPS,
        paint: {
          "circle-color": bluePoints.point,
          "circle-radius": 5,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff",
        },
      },
    ],
    // A fragment (no version or glyphs) to overlay on the base style
  } as unknown as mapboxgl.Style;
}

/** Every public trip, one point each (its first stop), clustered */
export function tripPointsStyle(points: TripPoint[]): mapboxgl.Style {
  const features = points.map((point) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [point.lng, point.lat],
    },
    properties: { trip_id: point.trip_id, name: point.name },
  }));
  return clusteredPointsStyle(TRIP_POINTS, features);
}

/**
 * A trip's stops' map behavior: frames the map around them and pins the
 * picked stop.
 */
export function TripStopsOnMap({
  stops,
  selectedStopId,
}: {
  stops: any[];
  selectedStopId: number | null;
}): ReactNode {
  const coordinates = useMemo(
    () => locatedStops(stops).map(stopPosition),
    [stops]
  );
  const selected = locatedStops(stops).find(
    (stop) => stop.checkin.checkin_id === selectedStopId
  );
  let position: [number, number] | null = null;
  if (selected != null) position = stopPosition(selected);

  return [
    h(FitBounds, { key: "fit", coordinates }),
    h(SelectedPin, { key: "pin", position }),
  ];
}

/** A public trip as `/trips?points=true` lists it */
export interface TripPoint {
  trip_id: number;
  name: string;
  lng: number;
  lat: number;
}

/** The 10 most recent public trips (the `/trips` list's first page); null
 * while loading */
export function useRecentTrips(): any[] | null {
  return useRockdAPI("/trips?simple=true")?.success?.data ?? null;
}

/** Every public trip's point; null while loading */
export function useTripPoints(): TripPoint[] | null {
  const rows = useRockdAPI("/trips?points=true")?.success?.data;
  return useMemo(() => {
    if (rows == null) return null;
    // An API without points mode returns full trips, which have no point
    return rows.filter((row) => row.lng != null && row.lat != null);
  }, [rows]);
}
