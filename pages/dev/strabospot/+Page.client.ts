import { useMapRef } from "@macrostrat/mapbox-react";
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

import { useCallback, useEffect, useState, type ReactNode } from "react";
import h from "../../explore/main.module.sass";
import { RockdSiteIcon, useRockdAPI } from "~/components";
import { deletePins } from "../../explore/utils";
import { createCheckins } from "~/components/checkin.client";
import { mapStyle } from "../../explore/map-style";
import { atom, useAtom } from "jotai";
import { FeatureDetails } from "./featured-checkins";
import {
  refreshStoredStrabospotAuth,
  clearStoredStrabospotAuth,
} from "./strabospot-integration";
import { getStoredRockdPersonId, clearRockdAuth } from "../../login/rockd-auth";

interface SidebarProps {
  title: string;
  onClose?: () => void;
  children?: ReactNode;
  showCloseButton?: boolean;
  isStrabospotSynced: boolean;
  isCheckingStrabospotSync: boolean;
  onToggleStrabospotSync: () => void;
}
const strabospotSyncButtonBaseStyle = {
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "12px",
  letterSpacing: "0.01em",
  padding: "0 6px",
  height: "23px",
  minHeight: "23px",
  lineHeight: "1",
  border: "1px solid transparent",
  transition: "all 120ms ease",
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
};

const strabospotSyncButtonStyles = {
  checking: {
    ...strabospotSyncButtonBaseStyle,
    background: "transparent",
    color: "#6b7280",
    border: "1px solid #d1d5db",
    boxShadow: "none",
    cursor: "default",
  },
  synced: {
    ...strabospotSyncButtonBaseStyle,
    background: "linear-gradient(180deg, #7ee08f 0%, #43b864 100%)",
    color: "#2f6a41",
    border: "1px solid #379654",
    boxShadow:
      "inset 0 2px 4px rgba(16,53,29,0.2), inset 0 -1px 0 rgba(255,255,255,0.35), 0 1px 0 rgba(255,255,255,0.2)",
    transform: "translateY(1px)",
  },
  unsynced: {
    ...strabospotSyncButtonBaseStyle,
    background: "transparent",
    color: "inherit",
    border: "1px solid currentColor",
    boxShadow: "none",
  },
};

const strabospotBadgeImageStyle = {
  width: "22px",
  height: "22px",
  borderRadius: "4px",
  objectFit: "cover" as const,
  display: "block",
};

const strabospotSyncControlStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  transform: "translateY(6px)",
};

function Sidebar({
  title,
  onClose,
  children,
  showCloseButton = true,
  isStrabospotSynced,
  isCheckingStrabospotSync,
  onToggleStrabospotSync,
}: SidebarProps) {
  const _showCloseButton = showCloseButton && onClose != null;
  const [showSettings, setShowSettings] = useAtom(showSettingsAtom);

  return h("div.sidebar", [
    h(Navbar, { className: "sidebar-header" }, [
      h(RockdSiteIcon, { className: "site-icon" }),
      h("h1.page-title", title),
      h("div.tools", [
        h("div", { style: strabospotSyncControlStyle }, [
          h("img", {
            src: "https://strabospot.org/includes/mimages/pic01.jpg",
            alt: "StraboSpot",
            style: strabospotBadgeImageStyle,
          }),
          h(
            Button,
            {
              minimal: false,
              outlined: false,
              onClick: onToggleStrabospotSync,
              disabled: isCheckingStrabospotSync,
              style: isCheckingStrabospotSync
                ? strabospotSyncButtonStyles.checking
                : isStrabospotSynced
                ? strabospotSyncButtonStyles.synced
                : strabospotSyncButtonStyles.unsynced,
            },
            isCheckingStrabospotSync
              ? "Checking..."
              : isStrabospotSynced
              ? "Synced"
              : "Link to Strabospot"
          ),
        ]),
        h(ToolButton, {
          icon: "settings",
          onClick: () => setShowSettings(!showSettings),
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

export function Page() {
  const [showSatellite, setShowSatellite] = useAtom(showSatelliteAtom);
  const [showOverlay, setOverlay] = useAtom(showOverlayAtom);
  const [showSettings, setSettings] = useAtom(showSettingsAtom);
  const [isStrabospotSynced, setIsStrabospotSynced] = useState(false);
  const [isCheckingStrabospotSync, setIsCheckingStrabospotSync] =
    useState(true);
  const [rockdPersonId, setRockdPersonId] = useState<number | null>(null);
  const [rockdChecked, setRockdChecked] = useState(false);

  useEffect(() => {
    const personId = getStoredRockdPersonId();
    if (personId == null) {
      window.location.href = "/login";
      return;
    }
    setRockdPersonId(personId);
    setRockdChecked(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkStrabospotSync() {
      const ok = await refreshStoredStrabospotAuth();
      if (cancelled) return;
      setIsStrabospotSynced(ok);
      setIsCheckingStrabospotSync(false);
    }
    checkStrabospotSync();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleToggleStrabospotSync() {
    if (isStrabospotSynced) {
      clearStoredStrabospotAuth();
      setIsStrabospotSynced(false);
      return;
    }

    window.location.href = "/dev/strabospot/login";
  }

  const style = useMapStyle(
    type,
    mapboxAccessToken,
    showSatellite,
    showOverlay,
    rockdPersonId
  );

  const [selectedCheckin, setSelectedCheckin] = useState<number | null>(null);
  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
    deletePins(".selected_pin");
  }, []);

  const checkinData = useRockdAPI(
    selectedCheckin != null
      ? `/protected/checkins?checkin_id=${selectedCheckin}`
      : `/protected/checkins?checkin_id=0`
  );

  let overlay: ReactNode;

  if (showSettings) {
    overlay = h(
      Sidebar,
      {
        title: "Settings",
        onClose: () => setSettings(false),
        isStrabospotSynced,
        isCheckingStrabospotSync,
        onToggleStrabospotSync: handleToggleStrabospotSync,
      },
      h(ContextPanel)
    );
  } else if (selectedCheckin != null && checkinData?.success?.data) {
    const clickedCheckins = h(createSelectedCheckins, {
      data: checkinData.success.data,
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
        isStrabospotSynced,
        isCheckingStrabospotSync,
        onToggleStrabospotSync: handleToggleStrabospotSync,
      },
      h("div.checkin-container", clickedCheckins)
    );
  } else {
    overlay = h(
      Sidebar,
      {
        title: "My checkins",
        showCloseButton: false,
        isStrabospotSynced,
        isCheckingStrabospotSync,
        onToggleStrabospotSync: handleToggleStrabospotSync,
      },
      h(FeatureDetails, {
        setInspectPosition,
        isStrabospotSynced,
        personId: rockdPersonId,
      })
    );
  }

  if (!rockdChecked || rockdPersonId == null || style == null) return null;

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
        h(ClickedCheckins, { setSelectedCheckin }),
      ]),
    ])
  );
}

function useMapStyle(type, mapboxToken, showSatellite, showOverlay, personId) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";
  const satelliteStyle = "mapbox://styles/mapbox/satellite-v9";
  const finalStyle = showSatellite ? satelliteStyle : baseStyle;

  const [actualStyle, setActualStyle] = useState(null);

  const baseOverlayStyle = mapStyle(type);

  const strabospotOverlayStyle = {
    ...baseOverlayStyle,
    sources: {
      ...baseOverlayStyle.sources,
      weaver: {
        ...baseOverlayStyle.sources.weaver,
        tiles: [
          `${SETTINGS.rockdApiURL}/checkin-tile/{z}/{x}/{y}?cluster=true&person_id=${personId}`,
        ],
      },
    },
  };

  const overlayStyle = showOverlay
    ? mergeStyles(_macrostratStyle, strabospotOverlayStyle)
    : strabospotOverlayStyle;

  useEffect(() => {
    if (personId == null) {
      setActualStyle(null);
      return;
    }

    buildInspectorStyle(finalStyle, overlayStyle, {
      mapboxToken,
      inDarkMode: isEnabled,
    }).then((s) => {
      setActualStyle(s);
    });
  }, [isEnabled, showSatellite, showOverlay, personId, mapboxToken]);

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
  const [showOverlay, setOverlay] = useAtom(showOverlayAtom);
  const [showSatellite, setSatellite] = useAtom(showSatelliteAtom);

  function handleLogout() {
    clearRockdAuth();
    clearStoredStrabospotAuth();
    window.location.href = "/login";
  }

  return h(
    "div",
    {
      className: "settings-content",
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      },
    },
    [
      h(DarkModeButton, { className: "dark-btn", showText: true }),

      h(
        "div",
        {
          style: {
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          },
        },
        [
          h(
            Button,
            {
              className: showSatellite
                ? "selected satellite-style"
                : "satellite-style",
              onClick: () => setSatellite(!showSatellite),
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
              onClick: () => setOverlay(!showOverlay),
            },
            [
              h("div.btn-inside", [
                h(Icon, { className: "overlay-icon", icon: "map" }),
                h("p", "Overlay"),
              ]),
            ]
          ),
        ]
      ),

      h(
        "div",
        {
          style: {
            width: "100%",
            display: "flex",
            justifyContent: "center",
          },
        },
        [
          h(
            Button,
            {
              intent: "danger",
              outlined: true,
              onClick: handleLogout,
              style: {
                minWidth: "160px",
              },
            },
            [
              h("div.btn-inside", [
                h(Icon, { icon: "log-out" }),
                h("p", "Logout"),
              ]),
            ]
          ),
        ]
      ),
    ]
  );
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
        const coord = features[0].geometry.coordinates.slice();

        deletePins(".selected_pin");

        const el = document.createElement("div");
        el.className = "selected_pin";
        el.style.backgroundColor = "blue";
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.width = "15px";
        el.style.height = "15px";

        new mapboxgl.Marker(el).setLngLat(coord).addTo(map);
        setSelectedCheckin(Number(checkinId));
      } else {
        setSelectedCheckin(null);
        deletePins(".selected_pin");
      }
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map]);

  return null;
}
