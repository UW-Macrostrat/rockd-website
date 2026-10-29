import h from "./main.module.sass";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import type mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Comments } from "~/components";
import { MapSettingsPanel, MapSidebarLayout } from "~/components/map-sidebar";
import "@macrostrat/style-system";
import { mapboxAccessToken, rockdApiURL, SETTINGS } from "~/settings";
import { useDarkMode } from "@macrostrat/ui-components";
import { AnchorButton, Button, Card } from "@blueprintjs/core";
import { buildInspectorStyle, MapView } from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { type MapPosition, mergeStyles } from "@macrostrat/mapbox-utils";
import { useMapRef } from "@macrostrat/mapbox-react";
import { MapCheckinCard } from "~/components/checkin-feed";
import { atom, useAtom } from "jotai";

// The Macrostrat geologic map overlay, as /explore and /my-checkins draw it
const macrostratStyle = buildMacrostratStyle({
  tileserverDomain: SETTINGS.burwellTileDomain,
  fillOpacity: 0.3,
  strokeOpacity: 0.1,
}) as mapboxgl.Style;

const showSatelliteAtom = atom(false);
const showOverlayAtom = atom(true);

type SidebarView = "trip" | "settings" | "comments";

/**
 * A trip: its stops on the map, clustered as /my-checkins' checkins are, and
 * the trip's details and stops in the map pages' standard sidebar
 * (`MapSidebarLayout`).
 */
export function Trips({ data, commentsData }) {
  const [showSatellite, setShowSatellite] = useAtom(showSatelliteAtom);
  const [showOverlay, setShowOverlay] = useAtom(showOverlayAtom);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [view, setView] = useState<SidebarView>("trip");
  const style = useMapStyle(data.stops, showSatellite, showOverlay);

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
      showOverlay,
      onToggleOverlay: () => setShowOverlay(!showOverlay),
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

  if (style == null) return null;

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
        mapboxToken: mapboxAccessToken,
        mapPosition,
        standalone: false,
        onMapLoaded: () => setMapLoaded(true),
      },
      h(TripStopsInteraction, { stops: data.stops, mapLoaded })
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

/** Frames the map around the trip's stops, and makes them clickable: a
 * cluster zooms in to split, and a stop flies the map to it. */
function TripStopsInteraction({ stops, mapLoaded }) {
  const mapRef = useMapRef();

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || map == null) return;

    const lngs = stops.map((stop) => stop.checkin.lng);
    const lats = stops.map((stop) => stop.checkin.lat);
    map.fitBounds(
      [
        [Math.max(...lngs), Math.max(...lats)],
        [Math.min(...lngs), Math.min(...lats)],
      ],
      { padding: 40, maxZoom: 12, animate: false }
    );

    const zoomIntoCluster = (e) => {
      const feature = e.features?.[0];
      if (feature == null) return;
      const source = map.getSource(STOPS_SOURCE) as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(
        feature.properties.cluster_id,
        (error, zoom) => {
          if (error != null) return;
          map.easeTo({ center: feature.geometry.coordinates, zoom });
        }
      );
    };
    const flyToStop = (e) => {
      const feature = e.features?.[0];
      if (feature == null) return;
      map.flyTo({ center: feature.geometry.coordinates, zoom: 12 });
    };
    const showPointer = () => (map.getCanvas().style.cursor = "pointer");
    const hidePointer = () => (map.getCanvas().style.cursor = "");

    map.on("click", "clusters", zoomIntoCluster);
    map.on("click", "unclustered-point", flyToStop);
    for (const layer of ["clusters", "unclustered-point"]) {
      map.on("mouseenter", layer, showPointer);
      map.on("mouseleave", layer, hidePointer);
    }

    return () => {
      map.off("click", "clusters", zoomIntoCluster);
      map.off("click", "unclustered-point", flyToStop);
      for (const layer of ["clusters", "unclustered-point"]) {
        map.off("mouseenter", layer, showPointer);
        map.off("mouseleave", layer, hidePointer);
      }
    };
  }, [mapLoaded, stops]);

  return null;
}

/** The base map (light, dark or satellite) under the Macrostrat overlay and the
 * trip's stops, built as /my-checkins builds its style */
function useMapStyle(stops, showSatellite: boolean, showOverlay: boolean) {
  const inDarkMode = useDarkMode()?.isEnabled;
  const [style, setStyle] = useState<mapboxgl.Style | null>(null);

  let baseStyle = "mapbox://styles/mapbox/light-v10";
  if (inDarkMode) baseStyle = "mapbox://styles/mapbox/dark-v10";
  if (showSatellite) baseStyle = "mapbox://styles/mapbox/satellite-v9";

  const stopsStyle = useMemo(() => tripStopsStyle(stops), [stops]);

  useEffect(() => {
    let overlayStyle = stopsStyle;
    if (showOverlay) overlayStyle = mergeStyles(macrostratStyle, stopsStyle);

    buildInspectorStyle(baseStyle, overlayStyle, {
      mapboxToken: mapboxAccessToken,
      inDarkMode,
    }).then(setStyle);
  }, [baseStyle, showOverlay, inDarkMode, stopsStyle]);

  return style;
}

const STOPS_SOURCE = "trip-stops";

/** The trip's stops as a clustered source, drawn as /my-checkins draws its
 * checkin clusters (`explore/map-style`), at the size and color of its
 * smallest clusters: the layer ids match, too. */
function tripStopsStyle(stops): mapboxgl.Style {
  const features = stops.map((stop) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [stop.checkin.lng, stop.checkin.lat],
    },
    properties: { checkin_id: stop.checkin.checkin_id },
  }));

  return {
    sources: {
      [STOPS_SOURCE]: {
        type: "geojson",
        data: { type: "FeatureCollection", features },
        cluster: true,
        clusterRadius: 40,
      },
    },
    layers: [
      {
        id: "clusters",
        type: "circle",
        source: STOPS_SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": 7,
          "circle-color": "#7b7fa0",
          "circle-stroke-color": "#8b8eab",
          "circle-stroke-width": 3,
        },
      },
      {
        id: "cluster-count",
        type: "symbol",
        source: STOPS_SOURCE,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count"],
          "text-size": 10,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: { "text-color": "#fff" },
      },
      {
        id: "unclustered-point",
        type: "circle",
        source: STOPS_SOURCE,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#868aa2",
          "circle-radius": 4,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      },
    ],
    // A fragment (no version or glyphs) to overlay on the base style
  } as unknown as mapboxgl.Style;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
