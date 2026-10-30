import { useMapInitialized, useMapRef } from "@macrostrat/mapbox-react";
import { getMapPosition, type MapPosition } from "@macrostrat/mapbox-utils";
import { type PrimitiveAtom, useSetAtom, useStore } from "jotai";
import mapboxgl from "mapbox-gl";
import { useEffect, useState } from "react";
import type { PointLayers } from "./map-style";

/** Point layers a click can pick from, and what picking one of its points does */
export interface PointTarget {
  layers: PointLayers;
  onPick: (feature: mapboxgl.MapboxGeoJSONFeature) => void;
}

/**
 * Map clicks as /explore handles them, over one or more point layers (earlier
 * `targets` win where they overlap): a cluster zooms in to split, a single
 * point is picked, and any other click calls `onMiss`. Points and clusters
 * show a pointer. `targets` and `onMiss` should be memoized.
 */
export function MapPointClicks({
  targets,
  onMiss,
}: {
  targets: PointTarget[];
  onMiss: () => void;
}) {
  const mapRef = useMapRef();
  const initialized = useMapInitialized();

  useEffect(() => {
    const map = mapRef.current;
    if (!initialized || map == null) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      for (const { layers, onPick } of targets) {
        if (layers.clusters != null) {
          const [cluster] = map.queryRenderedFeatures(e.point, {
            layers: [layers.clusters],
          });
          if (cluster != null) {
            zoomIntoCluster(map, layers, cluster);
            onMiss();
            return;
          }
        }
        const [point] = map.queryRenderedFeatures(e.point, {
          layers: [layers.points],
        });
        if (point != null) {
          onPick(point);
          return;
        }
      }
      onMiss();
    };
    const showPointer = () => (map.getCanvas().style.cursor = "pointer");
    const hidePointer = () => (map.getCanvas().style.cursor = "");
    const layerIds = targets.flatMap(({ layers }) =>
      [layers.clusters, layers.points].filter((id) => id != null)
    );

    map.on("click", handleClick);
    for (const layer of layerIds) {
      map.on("mouseenter", layer, showPointer);
      map.on("mouseleave", layer, hidePointer);
    }

    return () => {
      map.off("click", handleClick);
      for (const layer of layerIds) {
        map.off("mouseenter", layer, showPointer);
        map.off("mouseleave", layer, hidePointer);
      }
    };
  }, [initialized, targets, onMiss]);

  return null;
}

function zoomIntoCluster(
  map: mapboxgl.Map,
  layers: PointLayers,
  cluster: mapboxgl.MapboxGeoJSONFeature
) {
  const center = (cluster.geometry as GeoJSON.Point).coordinates as [
    number,
    number,
  ];
  layers
    .expansionZoom?.(map, cluster)
    .then((zoom) => map.flyTo({ center, zoom, speed: 10, curve: 0.5 }))
    .catch(() => {});
}

/** The blue pin on a picked point, as /explore marks a picked checkin. */
export function SelectedPin({
  position,
}: {
  position: [number, number] | null | undefined;
}) {
  const mapRef = useMapRef();
  const initialized = useMapInitialized();
  const lng = position?.[0];
  const lat = position?.[1];

  useEffect(() => {
    const map = mapRef.current;
    if (!initialized || map == null || lng == null || lat == null) return;

    const el = document.createElement("div");
    Object.assign(el.style, {
      backgroundColor: "blue",
      borderRadius: "50%",
      border: "2px solid white",
      width: "15px",
      height: "15px",
    });
    const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);

    return () => {
      marker.remove();
    };
  }, [initialized, lng, lat]);

  return null;
}

/** Keeps the map's position in `positionAtom` as it moves, so the page can
 * reopen where it was left (see `useRememberedMapPosition`). */
export function RememberMapPosition({
  positionAtom,
}: {
  positionAtom: PrimitiveAtom<MapPosition | null>;
}) {
  const mapRef = useMapRef();
  const initialized = useMapInitialized();
  const setPosition = useSetAtom(positionAtom);

  useEffect(() => {
    const map = mapRef.current;
    if (!initialized || map == null) return;

    const save = () => setPosition(getMapPosition(map));
    map.on("moveend", save);
    return () => {
      map.off("moveend", save);
    };
  }, [initialized]);

  return null;
}

/** Where a page's map opens: where `RememberMapPosition` last saw it in this
 * visit, or `fallback`. Read once, so the map isn't moved as it's saved. */
export function useRememberedMapPosition(
  positionAtom: PrimitiveAtom<MapPosition | null>,
  fallback: MapPosition
): MapPosition {
  const store = useStore();
  const [position] = useState(() => store.get(positionAtom) ?? fallback);
  return position;
}

/** Frames the map around `coordinates` whenever they change. They should be
 * memoized. */
export function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const mapRef = useMapRef();
  const initialized = useMapInitialized();

  useEffect(() => {
    const map = mapRef.current;
    if (!initialized || map == null || coordinates.length === 0) return;

    const lngs = coordinates.map(([lng]) => lng);
    const lats = coordinates.map(([, lat]) => lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 40, maxZoom: 12, animate: false }
    );
  }, [initialized, coordinates]);

  return null;
}
