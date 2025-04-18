import hyper from "@macrostrat/hyper";

import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner, Icon, Divider } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import {
  MapAreaContainer,
  MapMarker,
  MapView,
  PanelCard,
  buildInspectorStyle,
} from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import { useDarkMode, DarkModeButton } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import styles from "../main.module.sass";
import { createCheckins, useRockdAPI, Image } from "../index";
import "./main.sass";
import "@macrostrat/style-system";
import { LngLatCoords } from "@macrostrat/map-interface";

const h = hyper.styled(styles);

let count = 0;

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

const type = 
  {
    id: "Sample",
    name: "Sample",
    color: "purple",
  };

function weaverStyle(type: object) {
  const color = type?.color ?? "dodgerblue";
  return {
    sources: {
      weaver: {
        type: "vector",
        tiles: [ "https://dev.rockd.org/api/v2/checkin-tile/{z}/{x}/{y}?cluster=true"],
      }
    },
    layers: [
      {
        id: "weaver",
        type: "circle",
        source: "weaver",
        "source-layer": "default",
        paint: {
          "circle-radius": [
            "step",
            ["get", "n"],
            2,
            1,
            2,
            5,
            4,
            10,
            8,
            50,
            12,
            100,
            16,
            200,
            20,
          ],
          "circle-color": color,
          "circle-opacity": .8,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": color,
        },
      },
    ],
  };
}

function WeaverMap({
  mapboxToken,
}: {
  headerElement?: React.ReactElement;
  title?: string;
  children?: React.ReactNode;
  mapboxToken?: string;
}) {
  const [showSatelite, setSatelite] = useState(false);
  const style = useMapStyle(type, mapboxToken, showSatelite);

  // overlay
  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
    let previousSelected = document.querySelectorAll('.selected_pin');
    previousSelected.forEach((marker) => {
      marker.remove();
    });
  }, []);

  const selectedResult = getSelectedCheckins(inspectPosition?.lat - .05, inspectPosition?.lat + .05, inspectPosition?.lng - .05, inspectPosition?.lng + .05)?.success.data;
  const featuredCheckin = h(FeatureDetails, {setInspectPosition});
  const selectedCheckin = h(SelectedCheckins, {selectedResult, inspectPosition, setInspectPosition});
  let overlay;

  const LngLatProps = {
    position: {
        lat: inspectPosition?.lat ?? 0,
        lng: inspectPosition?.lng ?? 0
    },
    precision: 3,
    zoom: 10
  };

  if (inspectPosition && selectedResult.length > 0) {
    overlay = h("div.sidebox", [
      h('div.title', [
        h('div', { className: "selected-center" }, [
          h("h1", "Selected Checkins"),
          h('h3', { className: "coordinates" }, LngLatCoords(LngLatProps))
        ]),
        // h(DarkModeButton, { className: "dark-btn", showText: true } )
      ]),
      h("button", {
        className: "close-btn",
        onClick: () => {
          setInspectPosition(null);

          let previousSelected = document.querySelectorAll('.selected_pin');
          previousSelected.forEach((marker) => {
            marker.remove();
          });
        }
      }, "X"),
      h("div.overlay-div", selectedCheckin),
    ]);
  } else {
    overlay = h("div.sidebox", [
      h('div.sidebox-header', [
        h('div.title', [
          h("h1", "Featured Checkins"),
          // h(DarkModeButton, { className: "dark-btn", showText: true } )
        ]),
      ]),
      h("div.overlay-div", featuredCheckin),
    ]);
  }

  if(style == null) return null;

  return h(
    "div.map-container",
    [
      // The Map Area Container
      h(
        MapAreaContainer,
        {
          className: "map-area-container",
          style: { width: "70%", right: "30%" },
        },
        [
          h(MapView, { style, mapboxToken }, [
            h(MapMarker, {
              setPosition: onSelectPosition,
            }),
          ]),

          // The Overlay Div
          overlay,
          h(Toolbar, {showSatelite, setSatelite})
        ]
      ),
    ]
  );
  
}

function useMapStyle(type, mapboxToken, showSatelite) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";
  const sateliteStyle = 'mapbox://styles/mapbox/satellite-v9';
  const finalStyle = showSatelite ? sateliteStyle : baseStyle;

  const [actualStyle, setActualStyle] = useState(null);

  // Auto select sample type
  useEffect(() => {
    const overlayStyle = mergeStyles(_macrostratStyle, weaverStyle(type));
      buildInspectorStyle(finalStyle, overlayStyle, {
        mapboxToken,
        inDarkMode: isEnabled,
      }).then((s) => {
        setActualStyle(s);
      });
  }, [isEnabled, showSatelite]);

  return actualStyle;
}

function getCheckins(lat1, lat2, lng1, lng2) {
  // abitrary bounds around click point
  let minLat = Math.floor(lat1 * 100) / 100;
  let maxLat = Math.floor(lat2 * 100) / 100;
  let minLng = Math.floor(lng1 * 100) / 100;
  let maxLng = Math.floor(lng2 * 100) / 100;

  // change use map coords
  return useRockdAPI("protected/checkins?minlat=" + minLat + 
    "&maxlat=" + maxLat +
    "&minlng=" + minLng +
    "&maxlng=" + maxLng);
}

function getSelectedCheckins(lat1, lat2, lng1, lng2) {
  // abitrary bounds around click point
  let minLat = Math.floor(lat1 * 100) / 100;
  let maxLat = Math.floor(lat2 * 100) / 100;
  let minLng = Math.floor(lng1 * 100) / 100;
  let maxLng = Math.floor(lng2 * 100) / 100;

  // return 10 pages of results
  return useRockdAPI("protected/checkins?minlat=" + minLat + 
    "&maxlat=" + maxLat +
    "&minlng=" + minLng +
    "&maxlng=" + maxLng + "&all=10");
}

function SelectedCheckins({selectedResult, inspectPosition, setInspectPosition}) {
  const mapRef = useMapRef();
  const map = mapRef.current;

  // add selected checkin markers
  useEffect(() => {
    let selectedCords = [];

    let previousSelected = document.querySelectorAll('.selected_pin');
    previousSelected.forEach((marker) => {
      marker.remove();
    });

    // if selected checkins
    if(selectedResult?.length > 0 && inspectPosition) {
      selectedResult.forEach((checkin) => {
        selectedCords.push([checkin.lng, checkin.lat]);
      });

      let selectedStop = 0;
      selectedCords.forEach((coord) => {
        selectedStop++;
        // marker
        const el = document.createElement('div');
        el.className = 'selected_pin';

        // Create marker
        new mapboxgl.Marker(el)
          .setLngLat(coord)
          .addTo(map);
      });
    }
  }, [selectedResult]);

  return h("div", {className: 'checkin-container'}, createCheckins(selectedResult, mapRef, setInspectPosition));
}

function FeatureDetails({setInspectPosition}) {
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [bounds, setBounds] = useState(map?.getBounds());
  let checkins = [];
  let result;

  if(!map) {
    result = getCheckins(0, 0, 0, 0);
  } else if (bounds) {
    const distance = Math.abs(bounds.getEast() - bounds.getWest());
    const newWest = bounds.getWest() - distance * .2;
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), newWest, bounds.getEast());
  } else {
    result = getCheckins(0, 0, 0, 0);
  }

  if (!bounds && map) {
    setBounds(map.getBounds());
  }

  count++;

  // Update bounds on move
  useEffect(() => {
    if(map) {
      const listener = () => {
        setBounds(map.getBounds());
      };
      map.on("moveend", listener);
      return () => {
        map.off("moveend", listener);
      };
    }
  }, [bounds]);

  if (result == null) return h(Spinner);
  result = result.success.data;  

  checkins = createCheckins(result, mapRef, setInspectPosition);
  
  return h("div", {className: 'checkin-container'}, [
      h('div', checkins)
    ]);
}

function Toolbar({showSatelite, setSatelite}) {
  const [showSettings, setSettings] = useState(false);

  return h(PanelCard, { className: "toolbar", style: {padding: "0"} }, [
      h("div.toolbar-header", [
        h("a", { href: "/" }, 
          h(Image, { className: "home-icon", src: "favicon-32x32.png" }),
        ),
        h(Icon, { className: "settings-icon", icon: "settings", onClick: () => {
          setSettings(!showSettings);
        }
        }),
      ]),
      h("div", { className: showSettings ? "settings-content" : "hide" }, [
          h(Divider, { className: "divider" }),
          h("div", { className: "settings" }, [
              h(DarkModeButton, { className: "dark-btn", showText: true } ),
              h(PanelCard, {className: "map-style", onClick: () => {
                    setSatelite(!showSatelite);
                  }}, [
                      h(Icon, { className: "satellite-icon", icon: "satellite"}),
                      h("p", "Satellite"),
                  ]),
              ]),
          ])
    ]);
}