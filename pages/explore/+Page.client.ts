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
import { configDefinitionsBuiltInGlobal } from "vike/dist/esm/node/plugin/plugins/importUserCode/v1-design/getVikeConfig/configDefinitionsBuiltIn";
import chroma from "chroma-js";
import { a } from "vitest/dist/suite-IbNSsUWN";

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
  const clusterThreshold = 1;

  const baseColor = "#868aa2";
  const endColor = "#212435";

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
            'text-size': 10
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

  const toolbar = h(Toolbar, {showSettings, setSettings, showFilter, setFilter});
  const contextPanel = h(ContextPanel, {showSettings, showSatelite, setSatelite, showOverlay, setOverlay});
  const autoComplete = h(AutoComplete, {showFilter});

  if(selectedCheckin && checkinData) {
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
          toolbar,
          h("h1", "Featured Checkins"),
        ]),
      ]),
      h("div.overlay-div", featuredCheckin),
    ]);
  }

  if(style == null) return null;

  const sidePanel = h("div.side-panel", [
    autoComplete,
    contextPanel,
  ])

  return h(
    "div.map-container",
    [
      // The Map Area Container
      h(
        MapAreaContainer,
        {
          contextPanel: sidePanel,
          className: "map-area-container",
          style: { "padding-left": "calc(30% + 14px)",},
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

function FeatureDetails({setInspectPosition}) {
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [bounds, setBounds] = useState(map?.getBounds());
  let checkins = [];
  let result;

  if(!map) {
    result = getCheckins(0, 0, 0, 0);
  } else if (bounds) {
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast());
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

function Toolbar({showSettings, setSettings, showFilter, setFilter}) {
  return h("div", { className: "toolbar", style: {padding: "0"} }, [
      h("div.toolbar-header", [
        h("a", { href: "/" }, 
          h(Image, { className: "home-icon", src: "favicon-32x32.png" }),
        ),
        h(Icon, { className: "settings-icon", icon: "search", onClick: () => {
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

function ContextPanel({showSettings, showSatelite, setSatelite, showOverlay, setOverlay}) {
  return h(PanelCard, { className: showSettings ? "settings-content" : "hide" }, [
  h("div", { className: "settings" }, [
      h(DarkModeButton, { className: "dark-btn", showText: true } ),
      h(PanelCard, {className: "satellite-style", onClick: () => {
            setSatelite(!showSatelite);
          }}, [
              h(Icon, { className: "satellite-icon", icon: "satellite"}),
              h("p", "Satellite"),
          ]),
      h(PanelCard, {className: "map-style", onClick: () => {
            setOverlay(!showOverlay);
          }}, [
              h(Icon, { className: "overlay-icon", icon: "map"}),
              h("p", "Overlay"),
          ]),
    ]),
      
  ])
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
        console.log("cluster", cluster[0]);

        console.log("zoom", zoom);

        map.flyTo({
          center: cluster[0].geometry.coordinates,
          zoom: zoom,
          speed: 0.5,
        });
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point']
      });

      if (features.length > 0) {
        const checkinId = features[0].properties.id;

        // add marker
        const coord = features[0].geometry.coordinates.slice();
        console.log("coordinates", coord);

        const el = document.createElement('div');
        el.className = 'selected_pin';

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

function createSelectedCheckins(result, setInspectPosition) {
  const mapRef = useMapRef();

  return createCheckins(result.data, mapRef, setInspectPosition);
}

function AutoComplete({showFilter}) {
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [filters, setFilters] = useState([]);
  const [autocompleteOpen, setAutocompleteOpen] = useState(true);
  const [input, setInput] = useState('');
  const [close, setClose] = useState(false);  

  return h(PanelCard, { className: showFilter ? "autocomplete" : "hide" },)

  const person_data = getPersonCheckins(filters.length > 0 ? filters[0].id : 0)?.success.data;
  let filteredCheckins = h('div.filtered-checkins-container', [
    h("div.filtered-checkins", person_data && person_data.length > 0 ? createCheckins(person_data, mapRef, null) : null)
  ]);

  // add markers for filtered checkins
  let coordinates = [];
  let lngs = [];
  let lats = [];

  if(person_data && person_data.length > 0) {
    person_data.forEach((checkin) => {
      coordinates.push([checkin.lng, checkin.lat]);
      lngs.push(checkin.lng);
      lats.push(checkin.lat);
    });

    let previous = document.querySelectorAll('.filtered_pin');
    previous.forEach((marker) => {
      marker.remove();
    });

    let previousFeatured = document.querySelectorAll('.marker_pin');
    previousFeatured.forEach((marker) => {
      marker.remove();
    });

    if (!close) {
      let stop = 0;
      coordinates.forEach((coord) => {
        stop++;
        // marker
        const el = document.createElement('div');
        el.className = 'filtered_pin';

        const number = document.createElement('span');
        number.innerText = stop;

        // Append the number to the marker
        el.appendChild(number);

        // Create marker
        new mapboxgl.Marker(el)
          .setLngLat(coord)
          .addTo(map);
      });
    }

    map.fitBounds([
        [ Math.max(...lngs), Math.max(...lats) ],
        [ Math.min(...lngs), Math.min(...lats) ]
    ], {
        maxZoom: 12,
        duration: 0,
        padding: 75
    });
  }

  

  // rest
  const handleInputChange = (event) => {
    setAutocompleteOpen(true);
    setInput(event.target.value); 
    setClose(false);
  };

  let result = null;

  try {
    result = useRockdAPI("autocomplete/" + input);
  } catch (e) {
    return null;
  }

  let searchBar = h('div.search-bar', [
    h('input', { type: "text", placeholder: "Filter Checkins", onChange: handleInputChange }),
    h('div.search-icon', [
      h(Icon, { icon: "search" }),
    ]),
    h('div.x-icon', [
      h(Icon, { className: 'x-icon', icon: "cross", onClick: () => {
          let input = document.querySelector('input');
          input.value = "";
          setAutocompleteOpen(false);
          setClose(true);

          let previous = document.querySelectorAll('.filtered_pin');
          previous.forEach((marker) => {
            marker.remove();
          });
        } 
      }),
    ]),
  ]);

  let filterContainer = filters.length != 0 ? h("div.filter-container", [
    h('h2', "Filters"),
    h('ul', filters.map((item) => {
      return h("div.filter-item", [
        h('li', item.name),
        h('div.red-bar', { onClick: () => {
            setFilters(filters.filter((filter) => filter != item));
            if(filters.length == 1) {
              setClose(true);

              let previous = document.querySelectorAll('.filtered_pin');
              previous.forEach((marker) => {
                marker.remove();
              });
            }
          } 
        })
      ])
    })),
    filteredCheckins
  ]) : null; 

  
  if(!result || close) return h("div.autocomplete", searchBar);
  result = result.success.data;

  let taxa = result.taxa.length > 0  && autocompleteOpen ? h('div.taxa', [  
      h('h2', "Taxa"),
      h('ul', result.taxa.map((item) => {
        return h('li', { 
          onClick: () => { 
            if(!filters.includes(item)) {
              setAutocompleteOpen(false);
              setFilters(filters.concat([item]));
              console.log(item.id)
            }
          }
        }, item.name);
      }))
    ]) : null;

  let people = result.people.length > 0 && autocompleteOpen ? h('div.people', [  
    h('h2', "People"),
    h('ul', result.people.map((item) => {
      return h('li', { 
        onClick: () => { 
          if(!filters.includes(item)) {
            setAutocompleteOpen(false);
            setFilters(filters.concat([item]));
          }
        }
      }, item.name);
    }))
  ]) : null;

  let results = h("div.results", [
    taxa,
    people,
  ]);

  let wrapper = h('div.autocomplete-wrapper', [
    filterContainer,
    results,
  ]);

  return h(PanelCard, {className: showFilter ? "autocomplete" : "hide"}, [
    searchBar,
    wrapper
  ]);
}

function getPersonCheckins(personId) {
  return useRockdAPI("protected/checkins?person_id=" + personId);
}