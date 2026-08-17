/** Rockd usage heatmap.
 *
 * Dashboard-load density from the Macrostrat tileserver
 * (`/stats/rockd/dashboard/{z}/{x}/{y}`, MVT source-layer `dashboard_loads`,
 * properties `n_loads` / `n_clients`) — see layer-styles.ts for the contract.
 *
 * Styled after the Macrostrat dev map routes (/dev/map/topology, /heatmap): a
 * full-bleed globe inside MapAreaContainer, with a floating navbar and a
 * context panel, and a click inspector over the tile features. Replaces the
 * previous version, which drew one circle per raw dashboard request.
 */

import h from "./main.module.sass";
import { mapboxAccessToken } from "~/settings";
import { Spacer, useDarkMode } from "@macrostrat/ui-components";
import { removeMapLabels } from "@macrostrat/mapbox-utils";
import { useCallback, useMemo, useState } from "react";
import {
  FloatingNavbar,
  MapLoadingButton,
  MapAreaContainer,
  MapView,
  PanelCard,
  LocationPanel,
  MapMarker,
  FeatureSelectionHandler,
  Features,
} from "@macrostrat/map-interface";
// This repo imports package stylesheets per-page rather than globally (see
// pages/explore, pages/trip); there is no equivalent of the `web` repo's
// macrostrat-style-imports barrel. Without these the floating navbar, context
// panel and map controls render unstyled — the previous version of this page
// omitted them and worked around it with fixed heights in the module sass.
import "@macrostrat/map-interface/dist/map-interface.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { FormGroup, HTMLSelect, NonIdealState, Switch } from "@blueprintjs/core";
import { atom, useAtom, useAtomValue } from "jotai";
import { DENSITY_RAMP, dashboardDensityStyle } from "./layer-styles";

/** Shared width for the floating navbar and the context panel below it. */
const PANEL_WIDTH = 320;

/** Vector-tile source rendered by this page; everything else queried at the
 * click point is basemap noise we keep out of the inspector. */
const HEATMAP_SOURCES = new Set(["rockd-dashboard"]);

// --- View state -------------------------------------------------------------
// Plain jotai atoms rather than the URL-synced variants used in `web`: that
// helper (atomWithSearchParam) lives in the web repo's components barrel and
// has no equivalent here. Worth extracting into a shared package if this page
// grows more state.

const PERIODS = [
  { id: "all", label: "All time" },
  { id: "month", label: "This month" },
  { id: "today", label: "Today" },
] as const;

type PeriodID = (typeof PERIODS)[number]["id"];

const periodAtom = atom<PeriodID>("all");
const showLabelsAtom = atom(true);
const satelliteAtom = atom(false);

/** Resolved when the style is built, so "today"/"this month" stay correct
 * across a long-lived session. */
function periodParams(period: PeriodID): { start?: string } {
  const now = new Date();
  if (period === "today") return { start: now.toISOString().slice(0, 10) };
  if (period === "month") return { start: now.toISOString().slice(0, 7) };
  return {};
}

function baseStyleFor(satellite: boolean, dark: boolean): string {
  if (satellite) return "mapbox://styles/mapbox/satellite-v9";
  return dark
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";
}

export function Page() {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled ?? false;

  const period = useAtomValue(periodAtom);
  const showLabels = useAtomValue(showLabelsAtom);
  const satellite = useAtomValue(satelliteAtom);

  const [isOpen, setOpen] = useState(true);
  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);
  const [features, setFeatures] = useState<any[] | null>(null);

  const baseStyle = baseStyleFor(satellite, isEnabled);

  const overlayStyles = useMemo(
    () => [dashboardDensityStyle(periodParams(period))],
    [period]
  );

  const transformStyle = useCallback(
    (style: any) => (showLabels ? style : removeMapLabels(style, true)),
    [showLabels]
  );

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
  }, []);

  const contextPanel = h(
    PanelCard,
    { style: { width: PANEL_WIDTH } },
    h(LayerPanel)
  );

  let detailPanel = null;
  if (inspectPosition != null) {
    detailPanel = h(
      LocationPanel,
      { onClose: () => setInspectPosition(null), position: inspectPosition },
      h(MapInspector, { features })
    );
  }

  return h(
    MapAreaContainer,
    {
      navbar: h(
        FloatingNavbar,
        { className: "heatmap-navbar", width: PANEL_WIDTH },
        h(NavbarHeader, { isOpen, onToggle: () => setOpen(!isOpen) })
      ),
      contextPanel,
      detailPanel,
      contextPanelOpen: isOpen,
    },
    h(
      MapView,
      {
        style: baseStyle,
        // undefined, not null: the published type is
        // `MapPosition | undefined`, and undefined leaves the camera alone.
        mapPosition: undefined,
        projection: { name: "globe" },
        mapboxToken: mapboxAccessToken,
        overlayStyles,
        transformStyle,
      },
      [
        // Both accept a null position at runtime (meaning "nothing selected"),
        // but their published prop types are non-nullable.
        h(FeatureSelectionHandler, {
          selectedLocation: inspectPosition as any,
          setFeatures,
        }),
        h(MapMarker, {
          position: inspectPosition as any,
          setPosition: onSelectPosition,
        }),
      ]
    )
  );
}

function NavbarHeader({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  // The full-bleed layout has no footer, so the navbar carries the only way
  // back — standing in for the breadcrumb trail the Macrostrat dev map pages
  // get from their shared page-context components.
  return h("div.navbar-header", [
    h("div.nav-row", [h("a.home-link", { href: "/" }, "Rockd")]),
    h("div.title-row", [
      h("h2.page-title", "Usage heatmap"),
      h(Spacer),
      h(MapLoadingButton, { active: isOpen, onClick: onToggle, large: false }),
    ]),
  ]);
}

/** Click-inspector body: raw tile-feature properties (`n_loads`, `n_clients`)
 * via the shared dev feature display. */
function MapInspector({ features }: { features: any[] | null }) {
  let primitives = null;
  if (features != null) {
    primitives = features.filter((f: any) => HEATMAP_SOURCES.has(f.source));
  }

  if (primitives == null || primitives.length === 0) {
    return h(NonIdealState, {
      icon: "map-marker",
      title: "No data here",
      description: "No dashboard loads recorded in this cell.",
    });
  }

  return h(Features, { features: primitives });
}

function LayerPanel() {
  const [period, setPeriod] = useAtom(periodAtom);
  const [showLabels, setShowLabels] = useAtom(showLabelsAtom);
  const [satellite, setSatellite] = useAtom(satelliteAtom);

  return h("div.layer-panel", [
    h(
      "p.intro",
      "Where the Rockd app's dashboard is opened. Each hexagon aggregates the loads within it; colour and opacity scale with density on a scale that reads the same at every zoom. Click a cell for its counts."
    ),
    h(FormGroup, { label: "Period" }, [
      h(HTMLSelect, {
        fill: true,
        value: period,
        onChange: (e) => setPeriod(e.currentTarget.value as PeriodID),
        options: PERIODS.map((p) => ({ value: p.id, label: p.label })),
      }),
    ]),
    h(DensityLegend),
    h(FormGroup, { label: "Base map" }, [
      h(Switch, {
        label: "Satellite imagery",
        checked: satellite,
        onChange: (e) => setSatellite(e.currentTarget.checked),
      }),
      h(Switch, {
        label: "Labels",
        checked: showLabels,
        onChange: (e) => setShowLabels(e.currentTarget.checked),
      }),
    ]),
  ]);
}

/** Horizontal colour-ramp legend. Qualitative by design — exact counts come
 * from the click inspector, since the scale shifts with zoom. */
function DensityLegend() {
  const gradient = `linear-gradient(to right, ${DENSITY_RAMP.join(", ")})`;
  return h("div.density-legend", [
    h("div.legend-bar", { style: { background: gradient } }),
    h("div.legend-labels", [h("span", "fewer"), h("span", "more loads")]),
  ]);
}
