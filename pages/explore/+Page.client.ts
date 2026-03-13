import { MapboxMapProvider, useMapRef } from "@macrostrat/mapbox-react";
import { Button, Icon } from "@blueprintjs/core";
import { mapboxAccessToken, SETTINGS } from "~/settings";
import {
  buildInspectorStyle,
  MapMarker,
  MapView,
} from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { MapPosition, mergeStyles } from "@macrostrat/mapbox-utils";
import { DarkModeButton, useDarkMode } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import h from "./main.module.sass";
import { pageCarousel, useRockdAPI } from "~/components";
import "@macrostrat/style-system";

import { AutoComplete } from "./autocomplete";
import { deletePins } from "./utils";
import { FeatureDetails } from "./featured-checkins";
import { createCheckins } from "~/components/checkin.client";
import { mapStyle } from "./map-style";

import { type ReactNode } from "react";

interface SidebarProps {
  title: string;
  toolbar: ReactNode;
  onClose?: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
}

function Sidebar({
  title,
  toolbar,
  onClose,
  children,
  showCloseButton = true,
}: SidebarProps) {
  const _showCloseButton = showCloseButton && onClose != null;
  return h("div.sidebar", [
    h("div.sidebar-header", [
      h("div.title", [toolbar, h("h1", title)]),
      h.if(_showCloseButton)(Button, { icon: "cross" }),
    ]),
    h("div.sidebar-content", children as any),
  ]);
}

export function Page() {
  return h(
    "div.weaver-page",
    h(WeaverMap, { mapboxToken: SETTINGS.mapboxAccessToken })
  );
}

mapboxgl.accessToken = SETTINGS.mapboxAccessToken;

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

function WeaverMap({
  mapboxToken,
}: {
  headerElement?: ReactElement;
  title?: string;
  children?: React.ReactNode;
  mapboxToken?: string;
}) {
  const [showSatelite, setSatelite] = useState(false);
  const [showOverlay, setOverlay] = useState(true);
  const style = useMapStyle(type, mapboxToken, showSatelite, showOverlay);
  const [selectedCheckin, setSelectedCheckin] = useState(null);
  const [showSettings, setSettings] = useState(false);
  const [showFilter, setFilter] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

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

  const toolbar = h(Toolbar, {
    showSettings,
    setSettings,
    showFilter,
    setFilter,
  }) as ReactNode;
  const contextPanel = h(ContextPanel, {
    showSatelite,
    setSatelite,
    showOverlay,
    setOverlay,
  }) as ReactNode;
  const autoComplete = h(AutoComplete, {
    setFilteredData,
    autocompleteOpen,
    setAutocompleteOpen,
  }) as ReactNode;

  const filteredCheckinsComplete = h(FilteredCheckins, {
    filteredData: filteredData?.current,
    setInspectPosition,
  });
  const filteredPages = pageCarousel({
    page: filteredData?.next.page,
    setPage: filteredData?.next.setPage,
    nextData: filteredData?.next.data,
  });

  if (showFilter) {
    overlay = h(Sidebar, {
      title: "Filter checkins",
      toolbar,
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
        toolbar,
        onClose: () => {
          setSettings(false);
          setFilter(false);
        },
      },
      contextPanel
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
        toolbar,
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
        toolbar,
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
    MapboxMapProvider,
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

function useMapStyle(type, mapboxToken, showSatelite, showOverlay) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";
  const sateliteStyle = "mapbox://styles/mapbox/satellite-v9";
  const finalStyle = showSatelite ? sateliteStyle : baseStyle;

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
  }, [isEnabled, showSatelite, showOverlay]);

  return actualStyle;
}

function Toolbar({ showSettings, setSettings, showFilter, setFilter }) {
  return h("div.toolbar", [
    h("div.toolbar-header", [
      h(
        "a",
        { href: "/" },
        h("img", { className: "home-icon", src: "/rockd-icon-256.png" })
      ),
      h(Icon, {
        className: "settings-icon",
        icon: "filter",
        onClick: () => {
          setFilter(!showFilter);
        },
      }),
      h(Icon, {
        className: "settings-icon",
        icon: "settings",
        onClick: () => {
          setSettings(!showSettings);
        },
      }),
    ]),
  ]);
}

function ContextPanel({ showSatelite, setSatelite, showOverlay, setOverlay }) {
  return h("div", { className: "settings-content" }, [
    h(DarkModeButton, { className: "dark-btn", showText: true }),
    h(
      Button,
      {
        className: showSatelite
          ? "selected satellite-style"
          : "satellite-style",
        onClick: () => {
          setSatelite(!showSatelite);
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
