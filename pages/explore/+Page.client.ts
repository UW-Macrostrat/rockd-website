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
import { set } from "react-datepicker/dist/date_utils";

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
  const colors = {
    a: "#51bbd6",
    b: "#f1f075",
    c: "#f28cb1",
  };

  const clusterThreshold = 1;

  return {
    sources: {
      weaver: {
        type: "vector",
        tiles: [ "https://dev.rockd.org/api/v2/checkin-tile/{z}/{x}/{y}?cluster=true"],
      }
    },
    layers: [
      {
        id: "clusters",
        type: "circle",
        source: "weaver",
        "source-layer": "default",
        filter: ['>', ['get', 'n'], clusterThreshold],
        paint: {
          "circle-radius": [
            "step",
            ["get", "n"],
            15,
            100,
            20,
            750,
            30
          ],
          'circle-color': [
              'step',
              ['get', 'n'],
              colors.a,
              100,
              colors.b,
              750,
              colors.c
          ],
          "circle-opacity": .8,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": "#000",
        },
      },
      {
        id: 'cluster-count',
        type: 'symbol',
        source: 'weaver',
        "source-layer": "default",
        filter: ['has', 'n'],
        layout: {
            'text-field': ['get', 'n'],
            'text-size': 12
        }
      },
      {
        id: 'unclustered-point',
        type: 'circle',
        source: 'weaver',
        "source-layer": "default",
        filter: ['<=', ['get', 'n'], clusterThreshold],
        paint: {
            'circle-color': colors.a,
            'circle-radius': 4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
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
  const [selectedCheckin, setSelectedCheckin] = useState(null);  
  const [show, setShow] = useState(false);

  // overlay
  const [inspectPosition, setInspectPosition] = useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
    let previousSelected = document.querySelectorAll('.selected_pin');
    previousSelected.forEach((marker) => {
      marker.remove();
    });
  }, []);

  const featuredCheckin = h(FeatureDetails, {setInspectPosition});
  let overlay;

  const LngLatProps = {
    position: {
        lat: inspectPosition?.lat ?? 0,
        lng: inspectPosition?.lng ?? 0
    },
    precision: 3,
    zoom: 10
  };

  // handle selected checkins
  const checkinData = useRockdAPI(
    selectedCheckin ? `protected/checkins?checkin_id=${selectedCheckin}` : null
  );
  console.log("selected checki ", selectedCheckin);

  if(selectedCheckin && checkinData) {
    const clickedCheckins = createCheckins(checkinData?.success.data, mapboxToken, null);
    overlay = h("div.sidebox", [
      h('div.title', [
        h('div', { className: "selected-center" }, [
          h("h1", "Selected Checkins"),
          h('h3', { className: "coordinates" }, LngLatCoords(LngLatProps))
        ]),
      ]),
      h("button", {
        className: "close-btn",
        onClick: () => {
          setSelectedCheckin(null);

          let previousSelected = document.querySelectorAll('.selected_pin');
          previousSelected.forEach((marker) => {
            marker.remove();
          });
        }
      }, "X"),
      h("div.overlay-div", clickedCheckins),
    ]);
  } else {
    overlay = h("div.sidebox", [
      h('div.sidebox-header', [
        h('div.title', [
          h("h1", "Featured Checkins"),
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
          contextPanel: h(Toolbar, {showSatelite, setSatelite}),
          className: "map-area-container",
          style: { width: "70%", left: "30%" },
        },
        [
          h(MapView, { style, mapboxToken }, [
            h(MapMarker, {
              setPosition: onSelectPosition,
            }),
          ]),

          // The Overlay Div
          overlay,
          h(ClickedCheckins, {setSelectedCheckin}),
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
    const newEast = bounds.getEast() - distance * .2;
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), newEast);
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

function handleClusterClick() {
  const mapRef = useMapRef();
  const map = mapRef.current;
  // handle cluster click
  map?.on('click', 'clusters', (e) => {
    console.log("cluster click");
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    });

    console.log("features", features[0].properties.expansion_zoom);
  });

  return null;
}

function ClickedCheckins({setSelectedCheckin}) {
  const mapRef = useMapRef();
  const map = mapRef.current;

  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point']
      });

      if (features.length > 0) {
        const checkinId = features[0].properties.id;
        setSelectedCheckin(checkinId);
      } else {
        setSelectedCheckin(null); 
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map]);

  return null;
}