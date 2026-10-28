import { MapboxMapProvider, useMapRef } from "@macrostrat/mapbox-react";
import { Button, Icon } from "@blueprintjs/core";
import { mapboxAccessToken, SETTINGS } from "~/settings";
import {
  buildInspectorStyle,
  MapMarker,
  MapView,
} from "@macrostrat/map-interface";
import { MapSidebarLayout } from "~/components/map-sidebar";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { MapPosition, mergeStyles } from "@macrostrat/mapbox-utils";
import { DarkModeButton, useDarkMode } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import h from "./main.module.sass";
import { useRockdAPI } from "~/components";
import { MapCheckinFeed } from "~/components/checkin-feed";

import { deletePins } from "./utils";
import { createCheckins } from "~/components/checkin.client";
import { mapStyle } from "./map-style";
import { atom, useAtom } from "jotai";

mapboxgl.accessToken = mapboxAccessToken;

const _macrostratStyle = buildMacrostratStyle({
  tileserverDomain: SETTINGS.burwellTileDomain,
  fillOpacity: 0.3,
  strokeOpacity: 0.1,
}) as mapboxgl.Style;

const type = {
  id: "Sample",
  name: "Sample",
  color: "purple",
};

const showSatelliteAtom = atom(false);
const showOverlayAtom = atom(true);
const showSettingsAtom = atom(false);

export function Page() {
  const [showSatellite, setShowSatellite] = useAtom(showSatelliteAtom);
  const [showOverlay, setOverlay] = useAtom(showOverlayAtom);
  const style = useMapStyle(
    type,
    mapboxAccessToken,
    showSatellite,
    showOverlay
  );
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [showSettings, setSettings] = useAtom(showSettingsAtom);

  // overlay
  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
    deletePins(".selected_pin");
  }, []);

  // The sidebar shows one view at a time: settings, the selected checkins, or
  // (by default) the checkins in the map's view, searchable at the top
  let title: string;
  let sidebar: ReactNode;
  let onClose: (() => void) | undefined;

  // handle selected checkins
  const checkinData = useRockdAPI(
    selectedCheckin
      ? `/protected/checkins?checkin_id=${selectedCheckin}`
      : `/protected/checkins?checkin_id=0`
  );

  if (showSettings) {
    title = "Settings";
    onClose = () => setSettings(false);
    sidebar = h(ContextPanel);
  } else if (selectedCheckin && checkinData) {
    const clickedCheckins = h(createSelectedCheckins, {
      data: checkinData?.success.data,
      setInspectPosition,
    });
    title = "Selected checkins";
    onClose = () => {
      setSelectedCheckin(null);
      deletePins(".selected_pin");
    };
    sidebar = h("div.checkin-container", clickedCheckins);
  } else {
    title = "Featured checkins";
    sidebar = h(MapCheckinFeed, { feed: { feedType: "all" }, followMap: true });
  }

  if (style == null) return null;

  const mapPosition: MapPosition = {
    camera: {
      lat: 39,
      lng: -98,
      altitude: 6000000,
    },
  };

  return h(
    MapSidebarLayout,
    {
      title,
      sidebar,
      onClose,
      onToggleSettings: () => setSettings(!showSettings),
    },
    h(
      MapView,
      {
        style,
        mapboxToken: mapboxAccessToken,
        mapPosition,
        standalone: false,
      },
      [
        h(MapMarker, {
          setPosition: onSelectPosition,
        }),
        h(ClickedCheckins, { setSelectedCheckin }),
      ]
    )
  );
}

function useMapStyle(type, mapboxToken, showSatellite, showOverlay) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";
  const sateliteStyle = "mapbox://styles/mapbox/satellite-v9";
  const finalStyle = showSatellite ? sateliteStyle : baseStyle;

  const [actualStyle, setActualStyle] = useState(null);
  const overlayStyle = showOverlay
    ? mergeStyles(_macrostratStyle, mapStyle(type))
    : mapStyle(type);

  // Auto select sample type
  useEffect(() => {
    buildInspectorStyle(finalStyle, overlayStyle, {
      mapboxToken,
      inDarkMode: isEnabled,
    }).then((s) => {
      setActualStyle(s);
    });
  }, [isEnabled, showSatellite, showOverlay]);

  return actualStyle;
}

function ContextPanel() {
  const [showOverlay, setOverlay] = useAtom(showOverlayAtom);
  const [showSatellite, setSatellite] = useAtom(showSatelliteAtom);

  return h("div", { className: "settings-content" }, [
    h(DarkModeButton, { className: "dark-btn", showText: true }),
    h(
      Button,
      {
        className: showSatellite
          ? "selected satellite-style"
          : "satellite-style",
        onClick: () => {
          setSatellite(!showSatellite);
        },
      },
      [
        h("div.btn-inside", [
          h(Icon, { className: "satellite-icon", icon: "satellite" }),
          h("p", "Satellite"),
        ]),
      ]
    ),
    h(
      Button,
      {
        className: showOverlay ? "selected map-style" : "map-style",
        onClick: () => {
          setOverlay(!showOverlay);
        },
      },
      [
        h("div.btn-inside", [
          h(Icon, { className: "overlay-icon", icon: "map" }),
          h("p", "Overlay"),
        ]),
      ]
    ),
  ]);
}

function createSelectedCheckins(result, setInspectPosition) {
  const mapRef = useMapRef();

  return createCheckins(result.data, mapRef, setInspectPosition);
}

function ClickedCheckins({ setSelectedCheckin }) {
  const mapRef = useMapRef();
  const map = mapRef.current;

  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      const cluster = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });

      if (cluster.length > 0) {
        const zoom = cluster[0].properties.expansion_zoom;

        map.flyTo({
          center: cluster[0].geometry.coordinates,
          zoom: zoom + 2,
          speed: 10,
          curve: 0.5,
        });
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point"],
      });

      if (features.length > 0) {
        const checkinId = features[0].properties.id;

        // add marker
        const coord = features[0].geometry.coordinates.slice();

        const el = document.createElement("div");
        el.className = "selected_pin";
        el.style.backgroundColor = "blue";
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.width = "15px";
        el.style.height = "15px";

        new mapboxgl.Marker(el).setLngLat(coord).addTo(map);

        console.log("data", features[0]);
        setSelectedCheckin(checkinId);
      } else {
        setSelectedCheckin(null);
      }
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map]);

  return null;
}
