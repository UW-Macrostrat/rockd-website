import h from "./main.module.sass";
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
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
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);
  const style = useMapStyle(data.stops, showSatellite, showOverlay);

  // A stop picked on the map shows in the trip's own view
  const selectStop = useCallback((checkinId: number | null) => {
    setSelectedStopId(checkinId);
    if (checkinId != null) setView("trip");
  }, []);
  const selectedStop = data.stops.find(
    (stop) => stop.checkin.checkin_id === selectedStopId
  );

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
      selectedStopId,
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
      [
        h(TripStopsInteraction, {
          stops: data.stops,
          mapLoaded,
          onSelectStop: selectStop,
        }),
        h(SelectedStopPin, { checkin: selectedStop?.checkin }),
      ]
    )
  );
}

/** The trip's header, then its stops as the map pages' checkin cards, each
 * under its stop's name. The stop picked on the map is scrolled to and
 * highlighted. */
function TripDetails({ data, commentsData, selectedStopId, onShowComments }) {
  const listRef = useRef<HTMLDivElement>(null);
  useScrollToStop(listRef, selectedStopId);

  const stops = data.stops.map((stop, index) => {
    const checkinId = stop.checkin.checkin_id;
    let className: string | undefined;
    if (checkinId === selectedStopId) className = "selected";

    return h(
      "div.stop",
      { key: checkinId ?? index, className, "data-checkin-id": checkinId },
      [
        h("h4.stop-name", stop.name),
        h(MapCheckinCard, { data: stop.checkin }),
      ]
    );
  });

  return h("div.trip-details", [
    h(TripHeader, { data, commentsData, onShowComments }),
    h("div.stop-list", { ref: listRef }, stops),
  ]);
}

/** Scrolls the sidebar to a stop's card whenever it's picked on the map (or
 * the trip's view returns with one picked). */
function useScrollToStop(
  listRef: RefObject<HTMLDivElement | null>,
  checkinId: number | null
) {
  useEffect(() => {
    if (checkinId == null) return;
    const stop = listRef.current?.querySelector(
      `[data-checkin-id="${checkinId}"]`
    );
    stop?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [checkinId]);
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

/** Frames the map around the trip's stops, and handles map clicks as /explore
 * does: a cluster zooms in to split, a stop is picked (its card scrolled to in
 * the sidebar), and a click anywhere else clears the pick. */
function TripStopsInteraction({ stops, mapLoaded, onSelectStop }) {
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

    const handleClick = (e) => {
      const [cluster] = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      if (cluster != null) zoomIntoCluster(map, cluster);

      const [stop] = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point"],
      });
      onSelectStop(stop?.properties.checkin_id ?? null);
    };
    const showPointer = () => (map.getCanvas().style.cursor = "pointer");
    const hidePointer = () => (map.getCanvas().style.cursor = "");

    map.on("click", handleClick);
    for (const layer of ["clusters", "unclustered-point"]) {
      map.on("mouseenter", layer, showPointer);
      map.on("mouseleave", layer, hidePointer);
    }

    return () => {
      map.off("click", handleClick);
      for (const layer of ["clusters", "unclustered-point"]) {
        map.off("mouseenter", layer, showPointer);
        map.off("mouseleave", layer, hidePointer);
      }
    };
  }, [mapLoaded, stops, onSelectStop]);

  return null;
}

function zoomIntoCluster(map: mapboxgl.Map, cluster) {
  const source = map.getSource(STOPS_SOURCE) as mapboxgl.GeoJSONSource;
  source.getClusterExpansionZoom(cluster.properties.cluster_id, (error, zoom) => {
    if (error != null) return;
    map.easeTo({ center: cluster.geometry.coordinates, zoom });
  });
}

/** The blue pin /explore puts on a picked checkin, on the picked stop. */
function SelectedStopPin({ checkin }) {
  const mapRef = useMapRef();

  useEffect(() => {
    const map = mapRef.current;
    if (map == null || checkin == null) return;

    const el = document.createElement("div");
    Object.assign(el.style, {
      backgroundColor: "blue",
      borderRadius: "50%",
      border: "2px solid white",
      width: "15px",
      height: "15px",
    });
    const marker = new mapboxgl.Marker(el)
      .setLngLat([checkin.lng, checkin.lat])
      .addTo(map);

    return () => {
      marker.remove();
    };
  }, [checkin]);

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
