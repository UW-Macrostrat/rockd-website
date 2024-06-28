import { MapView } from "@macrostrat/map-interface";
import {
  MapboxMapProvider,
  useMapClickHandler,
  useMapEaseTo,
  useMapStyleOperator,
} from "@macrostrat/mapbox-react";
import { LngLatBounds } from "mapbox-gl";
import { FullscreenPage } from "~/layouts";
import h from "./main.module.sass";
import { baseMapURL, mapboxAccessToken } from "@macrostrat-web/settings";
import { PageBreadcrumbs } from "~/renderer";
import { Feature, FeatureCollection, LineString, Point } from "geojson";
import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { setGeoJSON } from "@macrostrat/mapbox-utils";
import { ColumnGeoJSONRecord } from "~/pages/map/map-interface/app-state/handlers/columns";
// Turf intersection
import { lineIntersect } from "@turf/line-intersect";
import { distance } from "@turf/distance";
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import { centroid } from "@turf/centroid";

import { buildCrossSectionLayers } from "~/_utils/map-layers";
import { fetchAllColumns } from "~/pages/map/map-interface/app-state/handlers/fetch";
import { getHashString, setHashString } from "@macrostrat/ui-components";
import { fmt2 } from "~/pages/map/map-interface/utils";

interface CorrelationState {
  focusedLine: LineString | null;
  columns: ColumnGeoJSONRecord[];
  onClickMap: (point: Point) => void;
  startup: () => Promise<void>;
}

/** Store management with Zustand */
const useCorrelationDiagramStore = create<CorrelationState>((set) => ({
  focusedLine: null as LineString | null,
  columns: [],
  onClickMap: (point: Point) =>
    set((state) => {
      if (
        state.focusedLine == null ||
        state.focusedLine.coordinates.length == 2
      ) {
        return {
          ...state,
          focusedLine: { type: "LineString", coordinates: [point.coordinates] },
        };
      } else {
        return {
          ...state,
          focusedLine: {
            type: "LineString",
            coordinates: [...state.focusedLine.coordinates, point.coordinates],
          },
        };
      }
    }),
  async startup() {
    const columns = await fetchAllColumns();
    let focusedLine = getFocusedLineFromHashParams();
    set({ columns, focusedLine });
  },
}));

function getFocusedLineFromHashParams(): LineString | null {
  if (typeof window === "undefined") {
    return null;
  }
  let hash = getHashString(window.location.hash);

  if (hash?.line == null) {
    return null;
  }

  try {
    let coords = hash.line;

    console.log("coords", coords);

    if (coords.length < 2) {
      return null;
    }
    if (coords.length % 2 != 0) {
      console.error("Invalid number of coordinates in hash string");
      return null;
    }

    coords = chunk(coords, 2);

    return {
      type: "LineString",
      coordinates: coords.map((coord) => coord.map(Number)),
    };
  } catch (e) {
    console.error("Error parsing hash string", e);
    return null;
  }
}

function chunk(arr, size) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export function Page() {
  const startup = useCorrelationDiagramStore((state) => state.startup);
  useEffect(() => {
    startup();
  }, []);

  return h(FullscreenPage, [
    h(HashStringManager),
    h("header", [h(PageBreadcrumbs)]),
    h("div.flex.row", [
      h("div.correlation-diagram"),
      h("div.assistant", [h(InsetMap)]),
    ]),
  ]);
}

function HashStringManager() {
  const focusedLine = useCorrelationDiagramStore((state) => state.focusedLine);
  useEffect(() => {
    if (focusedLine == null || focusedLine.coordinates.length < 2) {
      return;
    }
    let hash = {
      line: focusedLine.coordinates.flatMap((coord) => coord.map(fmt2)),
    };
    setHashString(hash);
  }, [focusedLine]);

  return null;
}

function InsetMap() {
  const focusedLine = useCorrelationDiagramStore((state) => state.focusedLine);
  const columns = useCorrelationDiagramStore((state) => state.columns);

  return h("div.column-selection-map", [
    h(
      MapboxMapProvider,
      h(MapView, { style: baseMapURL, accessToken: mapboxAccessToken }, [
        h(MapClickHandler),
        h(SectionLine, { focusedLine }),
        h(ColumnsLayer, { columns }),
        h(SelectedColumnsLayer, { columns, focusedLine }),
      ])
    ),
  ]);
}

function MapClickHandler() {
  const onClickMap = useCorrelationDiagramStore((state) => state.onClickMap);

  useMapClickHandler(
    (e) => {
      onClickMap({ type: "Point", coordinates: e.lngLat.toArray() });
    },
    [onClickMap]
  );

  return null;
}

function computeIntersectingColumns(
  columns: ColumnGeoJSONRecord[],
  line: LineString
): ColumnGeoJSONRecord[] {
  return columns.filter((col) => {
    const poly = col.geometry;
    const intersection = lineIntersect(line, poly);
    return intersection.features.length > 0;
  });
}

function SelectedColumnsLayer({ columns, focusedLine }) {
  useMapStyleOperator(
    (map) => {
      let features = [];
      if (columns != null && focusedLine != null) {
        features = computeIntersectingColumns(columns, focusedLine);
        features = orderColumnsByDistance(features, focusedLine);
      }

      const data: FeatureCollection = {
        type: "FeatureCollection",
        features,
      };

      const columnCentroidLine: Feature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: features.map(
            (col) => col.properties.centroid.geometry.coordinates
          ),
        },
        properties: {},
      };

      setGeoJSON(map, "selected-columns", data);
      setGeoJSON(map, "selected-column-centroids", {
        type: "FeatureCollection",
        features: [columnCentroidLine],
      });
    },
    [columns, focusedLine]
  );
  return null;
}

function orderColumnsByDistance(
  columns: ColumnGeoJSONRecord[],
  line: LineString
): ColumnGeoJSONRecord[] {
  const centroids = columns.map((col) => centroid(col.geometry));
  const projectedPoints = centroids.map((point) =>
    nearestPointOnLine(line, point)
  );
  const distances = projectedPoints.map((point) =>
    distance(point.geometry.coordinates, line.coordinates[0])
  );

  let newColumns = columns.map((col, i) => {
    return {
      ...col,
      properties: {
        ...col.properties,
        centroid: centroids[i],
        nearestPointOnLine: projectedPoints[i],
        distanceAlongLine: distances[i],
      },
    };
  });

  return sorted(newColumns, (d) => d.properties.distanceAlongLine);
}

function sorted(data, accessor: (d) => number) {
  return data.sort((a, b) => accessor(a) - accessor(b));
}

function ColumnsLayer({ columns, enabled = true }) {
  useMapStyleOperator(
    (map) => {
      if (columns == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: columns,
      };
      const sourceID = "columns";
      setGeoJSON(map, sourceID, data);

      const columnLayers = buildColumnLayers(sourceID);
      for (let layer of columnLayers) {
        if (map.getSource(layer.source) == null) {
          continue;
        }
        if (map.getLayer(layer.id) == null) {
          map.addLayer(layer);
        }
      }
    },
    [columns, enabled]
  );
  return null;
}

function buildColumnLayers(sourceID: string) {
  return [
    {
      id: "selected-columns-fill",
      type: "fill",
      source: "selected-columns",
      paint: {
        "fill-color": "rgba(255, 0, 0, 0.1)",
      },
    },
    {
      id: "selected-column-centroids-line",
      type: "line",
      source: "selected-column-centroids",
      paint: {
        "line-color": "rgba(255, 0, 0, 0.8)",
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    },
    {
      id: "selected-column-centroids-points",
      type: "circle",
      source: "selected-column-centroids",
      paint: {
        "circle-radius": 4,
        "circle-color": "rgba(255, 0, 0, 0.8)",
      },
    },
    {
      id: "columns-fill",
      type: "fill",
      source: sourceID,
      paint: {
        "fill-color": "rgba(0, 0, 0, 0.1)",
      },
    },
    {
      id: "columns-line",
      type: "line",
      source: sourceID,
      paint: {
        "line-color": "rgba(0, 0, 0, 0.5)",
        "line-width": 1,
      },
    },
  ];
}

function SectionLine({ focusedLine }: { focusedLine: LineString }) {
  // Setup focused line
  useMapStyleOperator(
    (map) => {
      if (focusedLine == null) {
        return;
      }
      const data: FeatureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: focusedLine,
            properties: { id: "focusedLine" },
          },
        ],
      };

      setGeoJSON(map, "crossSectionLine", data);
      setGeoJSON(map, "crossSectionEndpoints", {
        type: "FeatureCollection",
        features: focusedLine.coordinates.map((coord) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: coord },
          properties: {},
        })),
      });

      // Add layers
      const layers = buildCrossSectionLayers();
      for (let layer of layers) {
        if (map.getSource(layer.source) == null) {
          continue;
        }
        if (map.getLayer(layer.id) == null) {
          map.addLayer(layer);
        }
      }
    },
    [focusedLine]
  );

  const bounds = useMemo(() => {
    if (focusedLine == null || focusedLine?.coordinates.length < 2) {
      return null;
    }
    let bounds = new LngLatBounds();
    for (let coord of focusedLine.coordinates) {
      bounds.extend(coord);
    }
    return bounds;
  }, [focusedLine]);

  useMapEaseTo({ bounds, padding: 120 });

  return null;
}
