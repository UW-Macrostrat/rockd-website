/**
 * The "nearby" feed's region-of-interest control: a small map whose marker is
 * the center point the feed is fetched around.
 *
 * The radius is *not* shown or adjustable, because it isn't a parameter — the
 * route hard-codes a 100 km cutoff around `lat`/`lng`. If a `radius` param is
 * added on the Rockd side, this is where it surfaces.
 */
import { Button, Callout } from "@blueprintjs/core";
import { MapMarker, MapView } from "@macrostrat/map-interface";
import { MapboxMapProvider } from "@macrostrat/mapbox-react";
import "@macrostrat/map-interface/dist/map-interface.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDarkMode } from "@macrostrat/ui-components";
import type { MapPosition } from "@macrostrat/mapbox-utils";
import hyper from "@macrostrat/hyper";
import { useCallback, useState } from "react";
import { mapboxAccessToken } from "~/settings";
import styles from "./nearby-map.module.sass";

const h = hyper.styled(styles);

/** Matches the route's fixed cutoff, for the label only. */
export const NEARBY_RADIUS_KM = 100;

export interface Center {
  lng: number;
  lat: number;
}

export interface NearbyMapProps {
  center: Center | null;
  setCenter: (center: Center) => void;
}

/** A camera altitude that frames roughly the queried radius. */
const ALTITUDE = 1_200_000;

export function NearbyMap({ center, setCenter }: NearbyMapProps) {
  const { isEnabled: inDarkMode } = useDarkMode();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const locate = useLocate({ setCenter, setLocating, setLocateError });

  let style = "mapbox://styles/mapbox/light-v11";
  if (inDarkMode) style = "mapbox://styles/mapbox/dark-v11";

  const mapPosition: MapPosition = {
    camera: {
      lng: center?.lng ?? -98,
      lat: center?.lat ?? 39,
      altitude: ALTITUDE,
    },
  };

  let error = null;
  if (locateError != null) {
    error = h(Callout, { intent: "warning", compact: true }, locateError);
  }

  return h("div.nearby-map", [
    // `MapView` reads map state through `@macrostrat/mapbox-react`'s scoped
    // store, so it needs a provider. Elsewhere in this app that comes free from
    // `MapAreaContainer`; a bare helper map has to supply it, or the store's
    // isolation throws ("Missing Provider from createIsolation").
    h(
      "div.map-holder",
      h(
        MapboxMapProvider,
        h(
          MapView,
          {
            style,
            mapboxToken: mapboxAccessToken,
            mapPosition,
            standalone: true,
            className: "helper-map",
          },
          h(MapMarker, {
            position: center,
            setPosition: (pos: { lng: number; lat: number }) => {
              setCenter({ lng: pos.lng, lat: pos.lat });
            },
          })
        )
      )
    ),
    h("div.map-controls", [
      h(CenterLabel, { center }),
      h(
        Button,
        {
          icon: "locate",
          minimal: true,
          small: true,
          loading: locating,
          onClick: locate,
        },
        "Use my location"
      ),
    ]),
    error,
  ]);
}

function CenterLabel({ center }: { center: Center | null }) {
  if (center == null) {
    return h("span.center-label", "Click the map to choose a center point");
  }
  const coords = `${center.lat.toFixed(3)}, ${center.lng.toFixed(3)}`;
  return h(
    "span.center-label",
    `Within ${NEARBY_RADIUS_KM} km of ${coords}`
  );
}

interface LocateOptions {
  setCenter: (center: Center) => void;
  setLocating: (v: boolean) => void;
  setLocateError: (v: string | null) => void;
}

/** Browser geolocation, standing in for the app's device location. */
function useLocate({ setCenter, setLocating, setLocateError }: LocateOptions) {
  return useCallback(() => {
    if (typeof navigator === "undefined" || navigator.geolocation == null) {
      setLocateError("This browser can't report a location.");
      return;
    }
    setLocateError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCenter({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        });
      },
      (err) => {
        setLocating(false);
        setLocateError(err.message ?? "Couldn't get your location.");
      }
    );
  }, [setCenter, setLocating, setLocateError]);
}
