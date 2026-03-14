import { MapboxMapProvider, useMapRef } from "@macrostrat/mapbox-react";
import { Button, Icon, Navbar } from "@blueprintjs/core";
import { mapboxAccessToken, SETTINGS } from "~/settings";
import {
  buildInspectorStyle,
  MapMarker,
  MapView,
  MapAreaContainer,
} from "@macrostrat/map-interface";
import "@macrostrat/map-interface/dist/map-interface.css";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { MapPosition, mergeStyles } from "@macrostrat/mapbox-utils";
import { DarkModeButton, useDarkMode } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import h from "./main.module.sass";
import { PageCarousel, RockdSiteIcon, useRockdAPI } from "~/components";

import { AutoComplete } from "./autocomplete";
import { deletePins } from "./utils";
import { FeatureDetails } from "./featured-checkins";
import { createCheckins } from "~/components/checkin.client";
import { mapStyle } from "./map-style";
import { atom, useAtom } from "jotai";

interface SidebarProps {
  title: string;
  onClose?: () => void;
  children?: ReactNode;
  showCloseButton?: boolean;
  showSettings?: boolean;
  setSettings?: (show: boolean) => void;
  showFilter?: boolean;
  setFilter?: (show: boolean) => void;
}

function Sidebar({
  title,
  onClose,
  children,
  showCloseButton = true,
}: SidebarProps) {
  const _showCloseButton = showCloseButton && onClose != null;
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);
  const [showFilter, setShowFilter] = useAtom(showFilterAtom);
  return h("div.sidebar", [
    h(Navbar, { className: "sidebar-header" }, [
      h(RockdSiteIcon, { className: "site-icon" }),
      h("h1.page-title", title),
      h("div.tools", [
        h(ToolButton, {
          icon: "filter",
          onClick: () => {
            setShowFilter(!showFilter);
          },
        }),
        h(ToolButton, {
          icon: "settings",
          onClick: () => {
            setShowSettings(!showSettings);
          },
        }),
        h.if(_showCloseButton)(ToolButton, { icon: "cross", onClick: onClose }),
      ]),
    ]),
    h("div.sidebar-content", children as any),
  ]);
}

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
const showFilterAtom = atom(false);
const autocompleteOpenAtom = atom(false);

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
  const [showFilter, setFilter] = useAtom(showFilterAtom);
  const [filteredData, setFilteredData] = useState(null);
  const [autocompleteOpen, setAutocompleteOpen] = useAtom(autocompleteOpenAtom);

  // overlay
  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
    deletePins(".selected_pin");
  }, []);

  let overlay;

  // handle selected checkins
  const checkinData = useRockdAPI(
    selectedCheckin
      ? `/protected/checkins?checkin_id=${selectedCheckin}`
      : `/protected/checkins?checkin_id=0`
  );

  const autoComplete = h(AutoComplete, {
    setFilteredData,
    autocompleteOpen,
    setAutocompleteOpen,
  }) as ReactNode;

  const filteredCheckinsComplete = h(FilteredCheckins, {
    filteredData: filteredData?.current,
    setInspectPosition,
  });
  const filteredPages = PageCarousel({
    page: filteredData?.next.page,
    setPage: filteredData?.next.setPage,
    nextData: filteredData?.next.data,
  });

  if (showFilter) {
    overlay = h(Sidebar, {
      title: "Filter checkins",
      onClose: () => {
        setFilter(false);
        setSettings(false);
        setFilteredData(null);
        deletePins(".filtered_pin");
      },
      children: h("div.autocomplete-container", [
        autoComplete,
        filteredData && !autocompleteOpen
          ? h("div.filtered-checkins", filteredCheckinsComplete)
          : null,
        filteredData && !autocompleteOpen ? filteredPages : null,
      ]) as any,
    });
  } else if (showSettings) {
    overlay = h(
      Sidebar,
      {
        title: "Settings",
        onClose: () => {
          setSettings(false);
          setFilter(false);
        },
      },
      h(ContextPanel)
    );
  } else if (selectedCheckin && checkinData) {
    const clickedCheckins = h(createSelectedCheckins, {
      data: checkinData?.success.data,
      setInspectPosition,
    });

    overlay = h(
      Sidebar,
      {
        title: "Selected checkins",
        onClose: () => {
          setSelectedCheckin(null);
          deletePins(".selected_pin");
        },
      },
      h("div.checkin-container", clickedCheckins)
    );
  } else {
    overlay = h(
      Sidebar,
      {
        title: "Featured checkins",
        showCloseButton: false,
      },
      h(FeatureDetails, { setInspectPosition })
    );
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
    MapAreaContainer,
    {
      detailStackProps: {
        className: h["map-controls"],
      },
    },
    h("div.map-page", [
      overlay,
      h("div.map-container", [
        h(
          MapView,
          {
            style,
            mapboxToken: mapboxAccessToken,
            mapPosition,
            standalone: false,
            className: "map-view",
          },
          [
            h(MapMarker, {
              setPosition: onSelectPosition,
            }),
          ]
        ),
        // The Overlay Div
        h(ClickedCheckins, { setSelectedCheckin }),
      ]),
    ])
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

function ToolButton({ icon, onClick }) {
  return h(Button, {
    icon,
    minimal: true,
    onClick,
  });
}

function ContextPanel() {
  const [showOverlay, setOverlay] = useAtom(showFilterAtom);
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

function FilteredCheckins({ filteredData, setInspectPosition }) {
  const mapRef = useMapRef();
  console.log("Filtered checkins", filteredData);
  return createCheckins(filteredData?.filteredData, mapRef, setInspectPosition);
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
