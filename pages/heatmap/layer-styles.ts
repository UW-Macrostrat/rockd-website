/** Mapbox overlay style for the Rockd usage heatmap.
 *
 * Consumes the dashboard-load density route from the Macrostrat tileserver:
 * `/stats/rockd/dashboard/{z}/{x}/{y}`, MVT source-layer `dashboard_loads`,
 * feature properties `n_loads` and `n_clients`. Those names are a cross-repo
 * contract with `macrostrat/services/tileserver/.../stats/rockd/` — change both
 * sides together.
 */

import { tileserverDomain } from "~/settings";

/** Sequential cool→warm ramp for usage density. Shared with the panel legend. */
export const DENSITY_RAMP = [
  "#2c7bb6",
  "#abd9e9",
  "#ffffbf",
  "#fdae61",
  "#d7191c",
];

const OPACITY_MIN = 0.25;
const OPACITY_MAX = 0.85;

/** H3 resolution the route bins at, indexed by tile zoom.
 *
 * MUST MIRROR `ZOOM_RESOLUTION` in the tileserver route. Duplicated here because
 * the colour scale has to know how much aggregation each zoom applies, and that
 * cannot be derived from the tile payload.
 *
 * z0–z5 share one resolution deliberately: the globe projection shows several
 * zoom levels at once, and varying resolution across them makes hexagons visibly
 * change size mid-globe. */
const ZOOM_RESOLUTION = [4, 4, 4, 4, 4, 4, 5, 6, 6, 7, 7, 8];
const MAX_RESOLUTION = 8;

/** Colour-scale anchors per H3 resolution: [median, 99th percentile] loads per
 * cell, indexed by resolution.
 *
 * MEASURED, not derived. An earlier version scaled the domain by the geometric
 * factor between resolutions (each H3 cell holds ~7 children, so ~7x the
 * counts). That is wrong for sparse data: coarsening mostly merges *empty*
 * space, so the real factor is ~2x, not 7x. Using 7x pushed the domain three
 * orders of magnitude too high and every cell clamped to the coldest colour.
 *
 * Anchoring on percentiles means a colour denotes the same *rank* at every zoom
 * — blue is a typical cell, red is a top-1% cell — rather than the same absolute
 * density. With data this clustered the two cannot both hold, and rank is the
 * more useful invariant for a usage map.
 *
 * Refresh from:
 *   SELECT r, percentile_disc(0.5)  WITHIN GROUP (ORDER BY n),
 *             percentile_disc(0.99) WITHIN GROUP (ORDER BY n)
 *   FROM generate_series(0,9) r, LATERAL (
 *     SELECT count(*) n FROM usage_stats.rockd_dashboard_loads
 *     GROUP BY h3_latlng_to_cell(POINT(lng,lat), r)) c
 *   GROUP BY r ORDER BY r;
 */
const DENSITY_ANCHORS: [number, number][] = [
  [1217, 568998], // res 0
  [200, 111810], // res 1
  [45, 31481], // res 2
  [20, 7403], // res 3
  [14, 2000], // res 4
  [8, 643], // res 5
  [5, 235], // res 6
  [4, 98], // res 7
  [3, 44], // res 8
  [2, 20], // res 9
];

function resolutionForZoom(z: number): number {
  if (z < 0) return ZOOM_RESOLUTION[0];
  if (z >= ZOOM_RESOLUTION.length) return MAX_RESOLUTION;
  return ZOOM_RESOLUTION[z];
}

const logLoads = ["log10", ["max", 1, ["to-number", ["get", "n_loads"]]]];

/** Colour ramp across the measured density range for one resolution. */
function densityRamp(resolution: number): any[] {
  const [low, high] = DENSITY_ANCHORS[resolution];
  const lo = Math.log10(low * 2);
  const hi = Math.log10(high * 2);
  const n = DENSITY_RAMP.length;
  const expr: any[] = ["interpolate", ["linear"], logLoads];
  for (let i = 0; i < n; i++) {
    expr.push(lo + ((hi - lo) * i) / (n - 1), DENSITY_RAMP[i]);
  }
  return expr;
}

/** Opacity over the same range, so thin cells recede and busy ones read solid. */
function opacityRamp(resolution: number): any[] {
  const [low, high] = DENSITY_ANCHORS[resolution];
  return [
    "interpolate",
    ["linear"],
    logLoads,
    Math.log10(low),
    OPACITY_MIN,
    Math.log10(high),
    OPACITY_MAX,
  ];
}

/** Wrap a ramp builder in a zoom `step`, with a stop wherever the route changes
 * H3 resolution. `zoom` must be the outermost expression input, so the ramps are
 * pre-built per zoom band. A `step`, not an `interpolate`, because resolution
 * changes in discrete jumps. */
function zoomStepped(build: (resolution: number) => any[]): any[] {
  const expr: any[] = ["step", ["zoom"], build(resolutionForZoom(0))];
  let previous = resolutionForZoom(0);
  for (let z = 1; z <= ZOOM_RESOLUTION.length; z++) {
    const resolution = resolutionForZoom(z);
    if (resolution !== previous) {
      expr.push(z, build(resolution));
      previous = resolution;
    }
  }
  return expr;
}

export interface DensityStyleOptions {
  /** Inclusive lower bound, `YYYY-MM-DD` or `YYYY-MM`. Omit for all time. */
  start?: string;
  /** Exclusive upper bound, same formats. */
  end?: string;
}

export function dashboardDensityStyle(
  options: DensityStyleOptions = {}
): mapboxgl.Style {
  const params = new URLSearchParams();
  if (options.start) params.set("start", options.start);
  if (options.end) params.set("end", options.end);
  const query = params.toString();

  // The paint ramps are built programmatically as expression arrays, which TS
  // types as `any[]` rather than the tagged union mapbox-gl declares — hence the
  // widening cast on the return.
  return {
    version: 8,
    sources: {
      "rockd-dashboard": {
        type: "vector",
        tiles: [
          `${tileserverDomain}/stats/rockd/dashboard/{z}/{x}/{y}` +
            (query ? `?${query}` : ""),
        ],
        // The route caps binning at H3 resolution 8 (privacy floor), reached at
        // z11 — overzoom past it rather than fetching tiles that add no detail.
        maxzoom: 11,
      },
    },
    layers: [
      {
        id: "dashboard-density",
        type: "fill",
        source: "rockd-dashboard",
        "source-layer": "dashboard_loads",
        paint: {
          "fill-color": zoomStepped(densityRamp),
          "fill-opacity": zoomStepped(opacityRamp),
        },
      },
    ],
  } as unknown as mapboxgl.Style;
}
