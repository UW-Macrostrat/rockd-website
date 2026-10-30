import { MapView } from "@macrostrat/map-interface";
import type { MapPosition } from "@macrostrat/mapbox-utils";
import { useAtom } from "jotai";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { type ReactNode, useState } from "react";
import { mapboxAccessToken } from "~/settings";
import h from "./map-sidebar.module.sass";
import {
  MapSidebarLayout,
  type MapSidebarLayoutProps,
} from "./map-sidebar-layout";
import { MapSettingsPanel } from "./settings-panel";
import {
  showOverlayAtom,
  showSatelliteAtom,
  useRockdMapStyle,
} from "./map-style";

mapboxgl.accessToken = mapboxAccessToken;

/** The contiguous US, where the map pages open */
export const defaultMapPosition: MapPosition = {
  camera: { lat: 39, lng: -98, altitude: 6000000 },
};

export interface RockdMapPageProps
  extends Omit<MapSidebarLayoutProps, "onToggleSettings" | "children"> {
  /** The page's own map layers, over the base map and Macrostrat overlay.
   * Memoize them: a new object rebuilds the style. Null holds the map back. */
  layers: mapboxgl.Style | null;
  mapPosition?: MapPosition;
  /** Controls the Settings view, for a page that closes it itself (when a
   * map click shows something in the sidebar) */
  showSettings?: boolean;
  onShowSettings?: (show: boolean) => void;
  /** Anything that works with the map: clicks, pins, framing */
  children?: ReactNode;
}

/**
 * A Rockd map page: `MapSidebarLayout` around the map (with the account
 * button in its header; `onLogout` is the page's own logout), the standard
 * Settings view (theme, satellite and overlay) in place of the page's own
 * sidebar while it's open, and the base map and Macrostrat overlay under the
 * page's `layers`.
 */
export function RockdMapPage({
  title,
  sidebar,
  onClose,
  tools,
  layers,
  mapPosition = defaultMapPosition,
  onLogout,
  showSettings,
  onShowSettings,
  children,
}: RockdMapPageProps) {
  const [ownShowSettings, setOwnShowSettings] = useState(false);
  const settingsShown = showSettings ?? ownShowSettings;
  const setSettingsShown = onShowSettings ?? setOwnShowSettings;
  const style = useRockdMapStyle(layers);

  // Settings stands in for the page's own sidebar while it's open
  let header = { title, sidebar, onClose };
  if (settingsShown) {
    header = {
      title: "Settings",
      sidebar: h(MapSettings),
      onClose: () => setSettingsShown(false),
    };
  }

  if (style == null) return null;

  return h(
    MapSidebarLayout,
    {
      ...header,
      tools,
      onLogout,
      onToggleSettings: () => setSettingsShown(!settingsShown),
    },
    h(
      MapView,
      {
        style,
        mapboxToken: mapboxAccessToken,
        mapPosition,
        standalone: false,
      },
      children
    )
  );
}

function MapSettings() {
  const [showSatellite, setShowSatellite] = useAtom(showSatelliteAtom);
  const [showOverlay, setShowOverlay] = useAtom(showOverlayAtom);

  return h(MapSettingsPanel, {
    showSatellite,
    onToggleSatellite: () => setShowSatellite(!showSatellite),
    showOverlay,
    onToggleOverlay: () => setShowOverlay(!showOverlay),
  });
}
