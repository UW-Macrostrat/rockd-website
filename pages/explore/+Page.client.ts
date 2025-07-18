import { useMapRef } from "@macrostrat/mapbox-react";
import { Icon, Button } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import {buildInspectorStyle } from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import { useDarkMode, DarkModeButton } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import h from "./main.module.sass";
import { useRockdAPI, Image, pageCarousel, createCheckins } from "~/components/general";
import "@macrostrat/style-system";
import { MapPosition } from "@macrostrat/mapbox-utils";
import {
  MapAreaContainer,
  MapMarker,
  MapView,
} from "@macrostrat/map-interface";
import { mapboxAccessToken } from "@macrostrat-web/settings";

import { AutoComplete } from "./autocomplete";
import { deletePins } from "./utils";
import { FeatureDetails } from "./featuredcheckins";

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
  const clusterThreshold = 1;

  const baseColor = "#868aa2";
  const endColor = "#212435";

  return {
    sources: {
      weaver: {
        type: "vector",
        tiles: [ SETTINGS.rockdApiURL + "/checkin-tile/{z}/{x}/{y}?cluster=true"],
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
            'step',
            ['get', 'n'],
            7, 50,
            9, 100,
            11, 150,
            13, 200,
            15, 
          ],
          "circle-color": [
            'step',
            ['get', 'n'],
            "#7b7fa0", 50,
            '#636b8d', 100,
            '#4a546e', 150,
            '#353b49', 200,
            endColor
          ],
          "circle-stroke-color": [
            'step',
            ['get', 'n'],
            "#8b8eab", 50,
            '#7a7e96', 100,
            '#5d5f7c', 150,
            '#484b63', 
          ],
          "circle-stroke-width": 3,
          "circle-stroke-opacity": 1,
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
          'text-size': 10,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          "text-color": "#fff"
        },
      },
      {
        id: 'unclustered-point',
        type: 'circle',
        source: 'weaver',
        "source-layer": "default",
        filter: ['<=', ['get', 'n'], clusterThreshold],
        paint: {
          'circle-color': baseColor,
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
  const [showOverlay, setOverlay] = useState(true);
  const style = useMapStyle(type, mapboxToken, showSatelite, showOverlay);
  const [selectedCheckin, setSelectedCheckin] = useState(null);  
  const [showSettings, setSettings] = useState(false);
  const [showFilter, setFilter] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  
  // overlay
  const [inspectPosition, setInspectPosition] = useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
    deletePins('.selected_pin');
  }, []);

  const featuredCheckin = h(FeatureDetails, {setInspectPosition});
  let overlay;

  // handle selected checkins
  const checkinData = useRockdAPI(
    selectedCheckin ? `/protected/checkins?checkin_id=${selectedCheckin}` :  `/protected/checkins?checkin_id=0`
  );

  const toolbar = h(Toolbar, {showSettings, setSettings, showFilter, setFilter});
  const contextPanel = h(ContextPanel, {showSatelite, setSatelite, showOverlay, setOverlay});
  const autoComplete = h(AutoComplete, {setFilteredData, autocompleteOpen, setAutocompleteOpen});

  const filteredCheckinsComplete = h(createFilteredCheckins, {filteredData: filteredData?.current, setInspectPosition});
  const filteredPages = pageCarousel({page: filteredData?.next.page, setPage: filteredData?.next.setPage, nextData: filteredData?.next.data});

  if(showFilter) {
    overlay = h('div.sidebox', [
      h('div.title', [
        toolbar,
        h("h1", "Filter Checkins"),
      ]),
      h("button", {
        className: "close-btn",
        onClick: () => {
          setFilter(false);
          setSettings(false);
          setFilteredData(null);
          deletePins('.filtered_pin');
        }
      }, "X"),
      h("div.overlay-div", [
        h('div.autocomplete-container', [
          autoComplete,
          filteredData && !autocompleteOpen ? h("div.filtered-checkins",filteredCheckinsComplete) : null,
          filteredData && !autocompleteOpen ? filteredPages : null
        ])
      ]),
    ])
  } else if(showSettings) {
    overlay = h('div.sidebox', [
      h('div.title', [
        toolbar,
        h("h1", "Settings"),
      ]),
      h("button", {
        className: "close-btn",
        onClick: () => {
          setSettings(false);
          setFilter(false);
        }
      }, "X"),
      h("div.overlay-div", contextPanel),
    ])
  } else if (selectedCheckin && checkinData) {
    const clickedCheckins = h(createSelectedCheckins, {data: checkinData?.success.data, setInspectPosition});

    overlay = h("div.sidebox", [
      h('div.title', [
        toolbar,
        h("h1", "Selected Checkins"),
      ]),
      h("button", {
        className: "close-btn",
        onClick: () => {
          setSelectedCheckin(null);
          deletePins('.selected_pin');
        }
      }, "X"),
      h("div.overlay-div", 
        h('div.checkin-container',clickedCheckins)
      ),
    ]);
  } else {
    overlay = h("div.sidebox", [
      h('div.sidebox-header', [
        h('div.title', [
          toolbar,
          h("h1", "Featured Checkins"),
        ]),
      ]),
      h("div.overlay-div", featuredCheckin),
    ]);
  }

  if(style == null) return null;

  const mapPosition: MapPosition = {
          camera: {
            lat: 39, 
            lng: -98, 
            altitude: 6000000,
          },
        };

  return h(MapContainer, {style, mapPosition, onSelectPosition, setSelectedCheckin, overlay});
}

function useMapStyle(type, mapboxToken, showSatelite, showOverlay) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";
  const sateliteStyle = 'mapbox://styles/mapbox/satellite-v9';
  const finalStyle = showSatelite ? sateliteStyle : baseStyle;

  const [actualStyle, setActualStyle] = useState(null);
  const overlayStyle = showOverlay ? mergeStyles(_macrostratStyle, weaverStyle(type)) : weaverStyle(type);

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

function Toolbar({showSettings, setSettings, showFilter, setFilter}) {
  return h("div", { className: "toolbar", style: {padding: "0"} }, [
      h("div.toolbar-header", [
        h("a", { href: "/" }, 
          h(Image, { className: "home-icon", src: "favicon-32x32.png" }),
        ),
        h(Icon, { className: "settings-icon", icon: "filter", onClick: () => {
            setFilter(!showFilter);
          }
        }),
        h(Icon, { className: "settings-icon", icon: "settings", onClick: () => {
            setSettings(!showSettings);
          }
        }),
      ]),
    ]);
}

function ContextPanel({showSatelite, setSatelite, showOverlay, setOverlay}) {
  return h("div", { className: "settings-content" }, [
    h(DarkModeButton, { className: "dark-btn", showText: true } ),
    h(Button, {className: showSatelite ? "selected satellite-style" : "satellite-style", onClick: () => {
      setSatelite(!showSatelite);
    }}, [
        h('div.btn-inside', [
          h(Icon, { className: "satellite-icon", icon: "satellite"}),
          h("p", "Satellite"),
        ])
    ]),
    h(Button, {className: showOverlay ? "selected map-style" : "map-style", onClick: () => {
      setOverlay(!showOverlay);
    }}, [
      h('div.btn-inside', [
        h(Icon, { className: "overlay-icon", icon: "map"}),
        h("p", "Overlay"),
      ])
    ]),
  ]);
}

function createSelectedCheckins(result, setInspectPosition) {
  const mapRef = useMapRef();

  return createCheckins(result.data, mapRef, setInspectPosition);
}

function createFilteredCheckins(filteredData, setInspectPosition) {
  const mapRef = useMapRef();
  
  return createCheckins(filteredData?.filteredData, mapRef, setInspectPosition);
}

export function MapContainer({style, mapPosition, onSelectPosition, setSelectedCheckin, overlay}) {
    return h(
        "div.map-container",
        [
          // The Map Area Container
          h(
            MapAreaContainer,
            {
              className: "map-area-container",
              style: { "paddingLeft": "calc(30% + 14px)",},
            },
            [
              h(MapView, { style, mapboxToken: mapboxAccessToken, mapPosition }, [
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


function ClickedCheckins({setSelectedCheckin}) {
  const mapRef = useMapRef();
  const map = mapRef.current;

  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      const cluster = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });

      if(cluster.length > 0) {
        const zoom = cluster[0].properties.expansion_zoom;

        map.flyTo({
          center: cluster[0].geometry.coordinates,
          zoom: zoom + 2,
          speed: 10,
          curve: .5,
        });
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point']
      });

      if (features.length > 0) {
        const checkinId = features[0].properties.id;

        // add marker
        const coord = features[0].geometry.coordinates.slice();

        const el = document.createElement('div');
        el.className = 'selected_pin';
        el.style.backgroundColor = 'blue';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.width = '15px';
        el.style.height = '15px';


        new mapboxgl.Marker(el)
          .setLngLat(coord)
          .addTo(map);

        console.log("data", features[0]);
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