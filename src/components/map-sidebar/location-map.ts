import { MapView } from "@macrostrat/map-interface";
import {
  MapboxMapProvider,
  useMapInitialized,
  useMapRef,
} from "@macrostrat/mapbox-react";
import type { MapPosition } from "@macrostrat/mapbox-utils";
import "@macrostrat/map-interface/dist/map-interface.css";
import type mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect } from "react";
import { mapboxAccessToken } from "~/settings";
import h from "./map-sidebar.module.sass";
import { SelectedPin } from "./map-points";
import { useRockdMapStyle } from "./map-style";

// No layers of the page's own: the pin marks the place
const NO_LAYERS = { sources: {}, layers: [] } as unknown as mapboxgl.Style;

// Where the map opens with no place yet: the contiguous US
const DEFAULT_CENTER = { lng: -98, lat: 39 };

export interface LngLat {
  lng: number;
  lat: number;
}

export interface LocationMapProps {
  /** The place, pinned; none yet shows the contiguous US unpinned */
  position: LngLat | null;
  /** Camera altitude in meters; a regional view by default */
  altitude?: number;
  /** Picks a place by clicking the map (the pin moves there) */
  onPick?: (position: LngLat) => void;
  className?: string;
}

/**
 * A small map of one place, as the map pages draw it: the base map (light,
 * dark or satellite, per the theme and Settings), the Macrostrat overlay and
 * the blue pin, which the map brings into view when the place changes. With
 * `onPick`, a click picks the place. Browser-only, as maps are; give its
 * container a height.
 */
export function LocationMap({
  position,
  altitude = 300000,
  onPick,
  className,
}: LocationMapProps) {
  const style = useRockdMapStyle(NO_LAYERS);
  const center = position ?? DEFAULT_CENTER;
  const mapPosition: MapPosition = { camera: { ...center, altitude } };

  let pin: [number, number] | null = null;
  if (position != null) pin = [position.lng, position.lat];

  // A standalone map supplies its own map context (the map pages get theirs
  // from `MapAreaContainer`)
  let map = null;
  if (style != null) {
    map = h(
      MapboxMapProvider,
      h(
        MapView,
        {
          style,
          mapboxToken: mapboxAccessToken,
          mapPosition,
          standalone: true,
          // Within a page, scrolling scrolls the page; Ctrl/⌘ + scroll zooms
          cooperativeGestures: true,
          className: "location-map-view",
        },
        [
          h(SelectedPin, { key: "pin", position: pin }),
          h(KeepInView, { key: "view", position }),
          h.if(onPick != null)(PickOnClick, { key: "pick", onPick }),
        ]
      )
    );
  }

  return h("div.location-map", { className }, map);
}

/** Eases the map to the place when it changes to somewhere out of view (a
 * located position, say), leaving the view alone for a place picked on it */
function KeepInView({ position }: { position: LngLat | null }) {
  const mapRef = useMapRef();
  const initialized = useMapInitialized();

  useEffect(() => {
    const map = mapRef.current;
    if (!initialized || map == null || position == null) return;
    if (map.getBounds()?.contains([position.lng, position.lat])) return;
    map.easeTo({ center: [position.lng, position.lat] });
  }, [initialized, position?.lng, position?.lat]);

  return null;
}

/** A click on the map picks that place */
function PickOnClick({ onPick }: { onPick: (position: LngLat) => void }) {
  const mapRef = useMapRef();
  const initialized = useMapInitialized();

  useEffect(() => {
    const map = mapRef.current;
    if (!initialized || map == null) return;

    const pick = (event: mapboxgl.MapMouseEvent) =>
      onPick({ lng: event.lngLat.lng, lat: event.lngLat.lat });
    map.on("click", pick);
    map.getCanvas().style.cursor = "crosshair";
    return () => {
      map.off("click", pick);
      map.getCanvas().style.cursor = "";
    };
  }, [initialized, onPick]);

  return null;
}
