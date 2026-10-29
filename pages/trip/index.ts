import h from "./main.module.sass";
import { type ReactNode, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Comments } from "~/components";
import { MapSettingsPanel, MapSidebarLayout } from "~/components/map-sidebar";
import "@macrostrat/style-system";
import { rockdApiURL, SETTINGS } from "~/settings";
import { useDarkMode } from "@macrostrat/ui-components";
import { AnchorButton, Button, Card } from "@blueprintjs/core";
import { MapView } from "@macrostrat/map-interface";
import type { MapPosition } from "@macrostrat/mapbox-utils";
import { useMapRef } from "@macrostrat/mapbox-react";
import { MapCheckinCard } from "~/components/checkin-feed";
import { atom, useAtom } from "jotai";

const showSatelliteAtom = atom(false);

type SidebarView = "trip" | "settings" | "comments";

/**
 * A trip: its stops on the map, numbered in order, and the trip's details and
 * stops in the map pages' standard sidebar (`MapSidebarLayout`).
 */
export function Trips({ data, commentsData }) {
  const [showSatellite, setShowSatellite] = useAtom(showSatelliteAtom);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [view, setView] = useState<SidebarView>("trip");
  const style = useMapStyle(showSatellite);

  // The sidebar shows one view at a time: settings, the trip's comments, or
  // (by default) the trip and its stops
  let title = "Trips";
  let sidebar: ReactNode;
  let onClose: (() => void) | undefined;

  if (view === "settings") {
    title = "Settings";
    onClose = () => setView("trip");
    sidebar = h(MapSettingsPanel, {
      showSatellite,
      onToggleSatellite: () => setShowSatellite(!showSatellite),
    });
  } else if (view === "comments") {
    title = "Comments";
    onClose = () => setView("trip");
    sidebar = h("div.trip-comments", h(Comments, { comments: commentsData }));
  } else {
    sidebar = h(TripDetails, {
      data,
      commentsData,
      onShowComments: () => setView("comments"),
    });
  }

  let onToggleSettings = () => setView("settings");
  if (view === "settings") {
    onToggleSettings = () => setView("trip");
  }

  const start = data.stops[0].checkin;
  const mapPosition: MapPosition = {
    camera: {
      lat: start.lat,
      lng: start.lng,
      altitude: 300000,
    },
  };

  return h(
    MapSidebarLayout,
    { title, sidebar, onClose, onToggleSettings },
    h(
      MapView,
      {
        style,
        mapboxToken: SETTINGS.mapboxAccessToken,
        mapPosition,
        standalone: false,
        onMapLoaded: () => setMapLoaded(true),
      },
      h(TripMarkers, { stops: data.stops, mapLoaded })
    )
  );
}

/** The trip's header, then its stops as the map pages' checkin cards, each
 * under its stop's name. */
function TripDetails({ data, commentsData, onShowComments }) {
  const stops = data.stops.map((stop, index) =>
    h("div.stop", { key: stop.checkin.checkin_id ?? index }, [
      h("h4.stop-name", stop.name),
      h(MapCheckinCard, { data: stop.checkin }),
    ])
  );

  return h("div.trip-details", [
    h(TripHeader, { data, commentsData, onShowComments }),
    h("div.stop-list", stops),
  ]);
}

/** The trip's name, edited date and stop count, description, and its KMZ
 * download and comments, as one card over the stops. */
function TripHeader({ data, commentsData, onShowComments }) {
  const stopCount = data.stops.length;
  let stopLabel = `${stopCount} stops`;
  if (stopCount === 1) stopLabel = "1 stop";

  return h(Card, { className: "trip-header" }, [
    h("h2.trip-name", data.name),
    h("p.trip-meta", `Edited ${formatDate(data.updated)} · ${stopLabel}`),
    h.if(data.description)("p.description", data.description),
    h("div.trip-actions", [
      h(
        AnchorButton,
        {
          href: rockdApiURL + "/trips/" + data.trip_id + "?format=kmz",
          icon: "download",
          outlined: true,
          small: true,
        },
        "Download KMZ"
      ),
      h.if(commentsData?.length > 0)(
        Button,
        {
          icon: "comment",
          outlined: true,
          small: true,
          onClick: onShowComments,
        },
        `Comments (${commentsData?.length})`
      ),
    ]),
  ]);
}

/** Numbered markers for the trip's stops, which fly the map to their stop,
 * with the map framed around them all. */
function TripMarkers({ stops, mapLoaded }) {
  const mapRef = useMapRef();

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || map == null) return;

    const markers = stops.map((stop, index) => {
      const { lng, lat } = stop.checkin;
      const el = createStopMarker(index + 1);
      el.addEventListener("click", () => {
        map.flyTo({ center: [lng, lat], zoom: 12 });
      });
      return new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
    });

    const lngs = stops.map((stop) => stop.checkin.lng);
    const lats = stops.map((stop) => stop.checkin.lat);
    map.fitBounds(
      [
        [Math.max(...lngs), Math.max(...lats)],
        [Math.min(...lngs), Math.min(...lats)],
      ],
      { padding: 40, maxZoom: 12, animate: false }
    );

    return () => markers.forEach((marker) => marker.remove());
  }, [mapLoaded, stops]);

  return null;
}

function useMapStyle(showSatellite: boolean) {
  const inDarkMode = useDarkMode()?.isEnabled;
  if (showSatellite) return SETTINGS.satelliteMapURL;
  if (inDarkMode) return SETTINGS.darkMapURL;
  return SETTINGS.whiteMapURL;
}

/** A red pin numbered with the stop's place in the trip */
function createStopMarker(count: number): HTMLElement {
  const el = document.createElement("div");
  el.style.backgroundImage =
    'url("https://storage.macrostrat.org/assets/rockd/marker_red.png")';
  el.style.width = "60px";
  el.style.height = "60px";
  el.style.backgroundSize = "50%";
  el.style.display = "block";
  el.style.border = "none";
  el.style.cursor = "pointer";
  el.style.backgroundRepeat = "no-repeat";
  el.style.backgroundPosition = "center";

  const number = document.createElement("span");
  number.innerText = String(count);
  number.style.position = "absolute";
  number.style.top = "45%";
  number.style.left = "49%";
  number.style.transform = "translate(-50%, -50%)";
  number.style.color = "white";
  number.style.fontSize = "12px";
  number.style.fontWeight = "bold";
  el.appendChild(number);

  return el;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
