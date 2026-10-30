import { buildInspectorStyle } from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import { useDarkMode } from "@macrostrat/ui-components";
import { atom, useAtomValue } from "jotai";
import type mapboxgl from "mapbox-gl";
import { useEffect, useState } from "react";
import { mapboxAccessToken, SETTINGS } from "~/settings";

/** Settings' base map and overlay toggles, shared by every map page */
export const showSatelliteAtom = atom(false);
export const showOverlayAtom = atom(true);

// The Macrostrat geologic map, under each page's own layers
const macrostratStyle = buildMacrostratStyle({
  tileserverDomain: SETTINGS.burwellTileDomain,
  fillOpacity: 0.3,
  strokeOpacity: 0.1,
}) as mapboxgl.Style;

/**
 * A map page's style: the Mapbox base map (light, dark or satellite, per the
 * theme and Settings), the Macrostrat overlay while it's on, and the page's own
 * `layers` on top. Null until it's built, or while `layers` is null.
 * `layers` should be memoized: a new object rebuilds the style.
 */
export function useRockdMapStyle(
  layers: mapboxgl.Style | null
): mapboxgl.Style | null {
  const inDarkMode = useDarkMode()?.isEnabled ?? false;
  const showSatellite = useAtomValue(showSatelliteAtom);
  const showOverlay = useAtomValue(showOverlayAtom);
  const [style, setStyle] = useState<mapboxgl.Style | null>(null);

  let baseStyle = "mapbox://styles/mapbox/light-v10";
  if (inDarkMode) baseStyle = "mapbox://styles/mapbox/dark-v10";
  if (showSatellite) baseStyle = "mapbox://styles/mapbox/satellite-v9";

  useEffect(() => {
    if (layers == null) {
      setStyle(null);
      return;
    }
    let overlay = layers;
    if (showOverlay) overlay = mergeStyles(macrostratStyle, layers);

    let cancelled = false;
    buildInspectorStyle(baseStyle, overlay, {
      mapboxToken: mapboxAccessToken,
      inDarkMode,
    }).then((built) => {
      if (!cancelled) setStyle(built);
    });
    return () => {
      cancelled = true;
    };
  }, [baseStyle, showOverlay, inDarkMode, layers]);

  return style;
}

/** A point layer's colors: its clusters (fill and ring) and single points */
export interface PointColors {
  cluster: string;
  clusterStroke: string;
  point: string;
}

/** The checkin clusters' grey, at their smallest size */
export const greyPoints: PointColors = {
  cluster: "#7b7fa0",
  clusterStroke: "#8b8eab",
  point: "#868aa2",
};

/** Blueprint's blue, for points picked out from the grey ones */
export const bluePoints: PointColors = {
  cluster: "#2d72d2",
  clusterStroke: "#8abbff",
  point: "#2d72d2",
};

/**
 * A map page's clickable point layers: single points and, where they're
 * clustered, clusters, which zoom in to split.
 */
export interface PointLayers {
  points: string;
  clusters?: string;
  /** The zoom at which a cluster splits */
  expansionZoom?: (
    map: mapboxgl.Map,
    cluster: mapboxgl.MapboxGeoJSONFeature
  ) => Promise<number>;
}

// The checkin tile layers' ids
const CHECKIN_TILES = "weaver";

/** The checkin tiles' layers: clustered by the Rockd API, which reports each
 * cluster's expansion zoom. */
export const checkinTileLayers: PointLayers = {
  clusters: "clusters",
  points: "unclustered-point",
  expansionZoom: (map, cluster) =>
    Promise.resolve(cluster.properties.expansion_zoom + 2),
};

/**
 * Every public checkin (or one person's: `personId`), as the Rockd API's
 * clustered vector tiles, sized and shaded by cluster size.
 */
export function checkinTilesStyle(personId?: number): mapboxgl.Style {
  let tiles = `${SETTINGS.rockdApiURL}/checkin-tile/{z}/{x}/{y}?cluster=true`;
  if (personId != null) tiles += `&person_id=${personId}`;
  // A tile cluster's `n` is its checkin count; one checkin is a single point
  const clusterThreshold = 1;

  return {
    sources: {
      [CHECKIN_TILES]: { type: "vector", tiles: [tiles] },
    },
    layers: [
      {
        id: checkinTileLayers.clusters,
        type: "circle",
        source: CHECKIN_TILES,
        "source-layer": "default",
        filter: [">", ["get", "n"], clusterThreshold],
        paint: {
          "circle-radius": ["step", ["get", "n"], 7, 50, 9, 100, 11, 150, 13, 200, 15],
          "circle-color": [
            "step",
            ["get", "n"],
            greyPoints.cluster,
            50,
            "#636b8d",
            100,
            "#4a546e",
            150,
            "#353b49",
            200,
            "#212435",
          ],
          "circle-stroke-color": [
            "step",
            ["get", "n"],
            greyPoints.clusterStroke,
            50,
            "#7a7e96",
            100,
            "#5d5f7c",
            150,
            "#484b63",
          ],
          "circle-stroke-width": 3,
          "circle-stroke-opacity": 1,
        },
      },
      {
        id: "cluster-count",
        type: "symbol",
        source: CHECKIN_TILES,
        "source-layer": "default",
        filter: ["has", "n"],
        layout: {
          "text-field": ["get", "n"],
          "text-size": 10,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: { "text-color": "#fff" },
      },
      {
        id: checkinTileLayers.points,
        type: "circle",
        source: CHECKIN_TILES,
        "source-layer": "default",
        filter: ["<=", ["get", "n"], clusterThreshold],
        paint: {
          "circle-color": greyPoints.point,
          "circle-radius": 4,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      },
    ],
    // A fragment (no version or glyphs) to overlay on the base style
  } as unknown as mapboxgl.Style;
}

/** The layers `clusteredPointsStyle(id, …)` draws */
export function pointLayers(id: string): PointLayers {
  return {
    clusters: `${id}-clusters`,
    points: `${id}-points`,
    expansionZoom: (map, cluster) =>
      new Promise((resolve, reject) => {
        const source = map.getSource(id) as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(
          cluster.properties.cluster_id,
          (error, zoom) => {
            if (error != null) reject(error);
            else resolve(zoom);
          }
        );
      }),
  };
}

/**
 * Points the page already has, clustered in the browser and drawn as the
 * checkin tiles' smallest clusters are (in `colors`), with each cluster's
 * count. `features` are GeoJSON points; their properties ride along to clicks.
 */
export function clusteredPointsStyle(
  id: string,
  features: GeoJSON.Feature<GeoJSON.Point>[],
  colors: PointColors = greyPoints
): mapboxgl.Style {
  const layers = pointLayers(id);

  return {
    sources: {
      [id]: {
        type: "geojson",
        data: { type: "FeatureCollection", features },
        cluster: true,
        clusterRadius: 40,
      },
    },
    layers: [
      {
        id: layers.clusters,
        type: "circle",
        source: id,
        filter: ["has", "point_count"],
        paint: {
          "circle-radius": 7,
          "circle-color": colors.cluster,
          "circle-stroke-color": colors.clusterStroke,
          "circle-stroke-width": 3,
        },
      },
      {
        id: `${id}-cluster-count`,
        type: "symbol",
        source: id,
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
        id: layers.points,
        type: "circle",
        source: id,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": colors.point,
          "circle-radius": 4,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
      },
    ],
  } as unknown as mapboxgl.Style;
}
