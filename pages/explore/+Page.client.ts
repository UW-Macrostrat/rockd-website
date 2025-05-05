import hyper from "@macrostrat/hyper";

import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner, Icon, Divider, Button } from "@blueprintjs/core";
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
import { MapPosition } from "@macrostrat/mapbox-utils";
import { set } from "react-datepicker/dist/date_utils";
import { configDefinitionsBuiltInGlobal } from "vike/dist/esm/node/plugin/plugins/importUserCode/v1-design/getVikeConfig/configDefinitionsBuiltIn";
import { streamPipeNodeToString } from "vike/dist/esm/node/runtime/html/stream";

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
  const [filteredCheckins, setFilteredCheckins] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

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
    selectedCheckin ? `/protected/checkins?checkin_id=${selectedCheckin}` : null
  );

  const toolbar = h(Toolbar, {showSettings, setSettings, showFilter, setFilter});
  const contextPanel = h(ContextPanel, {showSettings, showSatelite, setSatelite, showOverlay, setOverlay});
  const autoComplete = h(AutoComplete, {showFilter, setFilteredCheckins, setFilteredData, autocompleteOpen, setAutocompleteOpen});

  const filteredCheckinsComplete = h(createFilteredCheckins, {filteredData, setInspectPosition});

  console.log("filteredData", filteredData);

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
          setFilteredCheckins(false);
          setFilteredData(null);
          let previous = document.querySelectorAll('.filtered_pin');
          previous.forEach((marker) => {
            marker.remove();
          }
          );
        }
      }, "X"),
      h("div.overlay-div", [
        h('div.autocomplete-container', [
          autoComplete,
          filteredData && !autocompleteOpen ? h("div.filtered-checkins",filteredCheckinsComplete) : null,
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

          let previousSelected = document.querySelectorAll('.selected_pin');
          previousSelected.forEach((marker) => {
            marker.remove();
          });
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

  const sidePanel = h("div.side-panel", [
    autoComplete,
    contextPanel,
  ])


  const mapPosition: MapPosition = {
          camera: {
            lat: 39, 
            lng: -98, 
            altitude: 6000000,
          },
        };

  return h(
    "div.map-container",
    [
      // The Map Area Container
      h(
        MapAreaContainer,
        {
          className: "map-area-container",
          style: { "padding-left": "calc(30% + 14px)",},
        },
        [
          h(MapView, { style, mapboxToken, mapPosition }, [
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
  return useRockdAPI("/protected/checkins?minlat=" + minLat + 
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
    result = getCheckins(40, 45, -60, -70);
  } else if (bounds) {
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast());
  } else {
    result = getCheckins(40, 45, -60, -70);
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

  if (result == null) return h(Spinner, { className: "loading-spinner" });
  result = result.success.data;  

  result.sort((a, b) => {
    if (a.photo === null && b.photo !== null) return 1;
    if (a.photo !== null && b.photo === null) return -1;
    return 0;
  });

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

function ContextPanel({showSettings, showSatelite, setSatelite, showOverlay, setOverlay}) {
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
          zoom: zoom + 2,
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

function createFilteredCheckins(filteredData, setInspectPosition) {
  const mapRef = useMapRef();
  
  return createCheckins(filteredData?.filteredData, mapRef, setInspectPosition);
}

function AutoComplete({showFilter, setFilteredCheckins, setFilteredData, autocompleteOpen, setAutocompleteOpen}) {
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [filters, setFilters] = useState([]);
  const [input, setInput] = useState('');
  const [close, setClose] = useState(false);  

  // test 
  const [peopleIds, setPeople] = useState([]);
  const [taxaIds, setTaxa] = useState([]);
  const [intervalIds, setIntervals] = useState([]);
  const [lithologyIds, setLithologies] = useState([]);
  const [lithologyTypes, setLithologyTypes] = useState([]);
  const [lithologyClasses, setLithologyClasses] = useState([]);
  const [lithologyAttributes, setLithologyAttributes] = useState([]);
  const [stratNameConcepts, setStratNameConcepts] = useState([]);
  const [stratNameOrphans, setStratNameOrphans] = useState([]);
  const [structures, setStructures] = useState([]);
  const [minerals, setMinerals] = useState([]);

  const lithParam = "lith_id=" + lithologyIds.map(item => item.id).join(',');
  const peopleParam = "person_id=" + peopleIds.map(item => item.id).join(',');
  const stratNameOrphanParam = "strat_name_orphan_id=" + stratNameOrphans.map(item => item.id).join(',');
  const lithologyAttributeParam = "lith_att_id=" + lithologyAttributes.map(item => item.id).join(',');
  const structureParam = "structure_id=" + structures.map(item => item.id).join(',');
  const taxaParam = "taxon_id=" + taxaIds.map(item => item.id).join(','); // fails
  const intervalParam = "int_id=" + intervalIds.map(item => item.id).join(','); // fails
  const stratNameConceptParam = "strat_name_concept_id=" + stratNameConcepts.map(item => item.id).join(','); // fails
  const mineralParam = "mineral_id=" + minerals.map(item => item.id).join(','); // fails
  const lithologyTypeParam = "=" + lithologyTypes.map(item => item.id).join(','); // doesn't exist
  const lithologyClassParam = "=" + lithologyClasses.map(item => item.id).join(','); // doesn't exist

  const params = [lithParam, peopleParam, lithologyAttributeParam, stratNameOrphanParam, structureParam].filter(param => /\d/.test(param));
  const finalParams = params
    .join('&');

  const queryString = finalParams ? "/protected/checkins?" + finalParams : null //  + "&all=1";
  console.log("queryString", queryString);

  const data = useRockdAPI(queryString)?.success.data;
  console.log("data", data);

  // filter data
  /*
  const lithData = getLithologyCheckins(lithologyIds.length > 0 ? lithologyIds.join(',') : null)?.success.data;
  const person_data = getPersonCheckins(peopleIds?.length > 0 ? peopleIds.map(item => item.id).join(',') : 0)?.success.data;
  const foundData = person_data && person_data.length > 0;

  if(foundData) {
    setFilteredCheckins(true);
    setFilteredData(person_data);
  } else {
    setFilteredCheckins(false);
    setFilteredData(null);
  }
  */

  // add markers for filtered checkins
  let coordinates = [];
  let lngs = [];
  let lats = [];

  if(data && data.length > 0) {
    setFilteredCheckins(true);
    setFilteredData(data);

    data.forEach((checkin) => {
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
  } else {
    setFilteredCheckins(false);
    setFilteredData(null);
  }

  // rest
  const handleInputChange = (event) => {
    setAutocompleteOpen(true);
    setInput(event.target.value); 
    setClose(false);
  };

  let result = null;

  try {
    result = useRockdAPI("/autocomplete/" + input);
  } catch (e) {
    return null;
  }

  let searchBar = h('div.search-bar', [
    h('input', { type: "text", placeholder: "Search name", onChange: handleInputChange }),
    h('div.x-icon', [
      h(Icon, { icon: "cross", onClick: () => {
          let input = document.querySelector('input');
          input.value = "";
          setAutocompleteOpen(false);
          setClose(true);
          setFilteredData(null);
          setFilters([]);

          let previous = document.querySelectorAll('.filtered_pin');
          previous.forEach((marker) => {
            marker.remove();
          });
        } 
      }),
    ]),
  ]);

  const sections = [
    peopleIds.length > 0 && h('div', [
      h('h3', 'People'),
      createFilteredItems(peopleIds, setPeople, setClose)
    ]),
    
    taxaIds.length > 0 && h('div', [
      h('h3', 'Taxa'),
      createFilteredItems(taxaIds, setTaxa, setClose)
    ]),
  
    intervalIds.length > 0 && h('div', [
      h('h3', 'Intervals'),
      createFilteredItems(intervalIds, setIntervals, setClose)
    ]),
  
    lithologyIds.length > 0 && h('div', [
      h('h3', 'Lithologies'),
      createFilteredItems(lithologyIds, setLithologies, setClose)
    ]),
  
    lithologyTypes.length > 0 && h('div', [
      h('h3', 'Lithology Types'),
      createFilteredItems(lithologyTypes, setLithologyTypes, setClose)
    ]),
  
    lithologyClasses.length > 0 && h('div', [
      h('h3', 'Lithology Classes'),
      createFilteredItems(lithologyClasses, setLithologyClasses, setClose)
    ]),
  
    lithologyAttributes.length > 0 && h('div', [
      h('h3', 'Lithology Attributes'),
      createFilteredItems(lithologyAttributes, setLithologyAttributes, setClose)
    ]),
  
    stratNameConcepts.length > 0 && h('div', [
      h('h3', 'Strat Name Concepts'),
      createFilteredItems(stratNameConcepts, setStratNameConcepts, setClose)
    ]),
  
    stratNameOrphans.length > 0 && h('div', [
      h('h3', 'Strat Name Orphans'),
      createFilteredItems(stratNameOrphans, setStratNameOrphans, setClose)
    ]),
  
    structures.length > 0 && h('div', [
      h('h3', 'Structures'),
      createFilteredItems(structures, setStructures, setClose)
    ]),
  
    minerals.length > 0 && h('div', [
      h('h3', 'Minerals'),
      createFilteredItems(minerals, setMinerals, setClose)
    ]),
  ].filter(Boolean);

  const filterContainer = sections.length != 0 ? h("div.filter-container", [
    h('h2', "Filters"),
    h('ul', [
      sections
    ]),
  ]) : null; 
  
  if(!result || close) return h('div', {className: "autocomplete"}, [
    searchBar
  ]);
  result = result.success.data;

  let results;

  if(autocompleteOpen) {
    const intervals = result?.intervals?.length > 0 ? h('div.intervals', [
      h('h2', "Intervals"),
      h('ul', createFilteredNames(result.intervals, setIntervals, intervalIds, setAutocompleteOpen))
    ]) : null;
    
    const lithologies = result?.lithologies?.length > 0 ? h('div.lithologies', [
      h('h2', "Lithologies"),
      h('ul', createFilteredNames(result.lithologies, setLithologies, lithologyIds, setAutocompleteOpen))
    ]) : null;
    
    const lithology_types = result?.lithology_types?.length > 0 ? h('div.lithology_types', [
      h('h2', "Lithology Types"),
      h('ul', createFilteredNames(result.lithology_types, setLithologyTypes, lithologyTypes, setAutocompleteOpen))
    ]) : null;
    
    const lithology_classes = result?.lithology_classes?.length > 0 ? h('div.lithology_classes', [
      h('h2', "Lithology Classes"),
      h('ul', createFilteredNames(result.lithology_classes, setLithologyClasses, lithologyClasses, setAutocompleteOpen))
    ]) : null;
    
    const lithology_attributes = result?.lithology_attributes?.length > 0 ? h('div.lithology_attributes', [
      h('h2', "Lithology Attributes"),
      h('ul', createFilteredNames(result.lithology_attributes, setLithologyAttributes, lithologyAttributes, setAutocompleteOpen))
    ]) : null;
    
    const strat_name_concepts = result?.strat_name_concepts?.length > 0 ? h('div.strat_name_concepts', [
      h('h2', "Stratigraphic Name Concepts"),
      h('ul', createFilteredNames(result.strat_name_concepts, setStratNameConcepts, stratNameConcepts, setAutocompleteOpen))
    ]) : null;
    
    const strat_name_orphans = result?.strat_name_orphans?.length > 0 ? h('div.strat_name_orphans', [
      h('h2', "Stratigraphic Name Orphans"),
      h('ul', createFilteredNames(result.strat_name_orphans, setStratNameOrphans, stratNameOrphans, setAutocompleteOpen))
    ]) : null;
    
    const structures_items = result?.structures?.length > 0 ? h('div.structures', [
      h('h2', "Structures"),
      h('ul', createFilteredNames(result.structures, setStructures, structures, setAutocompleteOpen))
    ]) : null;
    
    const minerals_items = result?.minerals?.length > 0 ? h('div.minerals', [
      h('h2', "Minerals"),
      h('ul', createFilteredNames(result.minerals, setMinerals, minerals, setAutocompleteOpen))
    ]) : null;    
    
    const people = result.people.length > 0 ? h('div.people', [
      h('h2', "People"),
      h('ul', createFilteredNames(result.people, setPeople, peopleIds, setAutocompleteOpen)),
    ]) : null;
    
    const taxa = result.taxa.length > 0 ? h('div.taxa', [
      h('h2', "Taxa"),
      h('ul', createFilteredNames(result.taxa, setTaxa, taxaIds, setAutocompleteOpen)),
    ]) : null;
    


    // result
    results = h('div.results', [
      people,
      taxa,
      intervals,
      lithologies,
      lithology_types,
      lithology_classes,
      lithology_attributes,
      strat_name_concepts,
      strat_name_orphans,
      structures_items,
      minerals_items
    ]);
  }

  /*
  useEffect(() => {
    setLithologyData(useRockdAPI("/proctected/checkins?lith_id=" + lithologies.map(item => item.id).join(',') + "&all=100"));
  }, [lithologies]);
  */

  const wrapper = h('div.autocomplete-wrapper', [
    filterContainer,
    results,
  ]);

  return h('div.autocomplete', [
    searchBar,
    wrapper,
  ]);
}

function getPersonCheckins(personId) {
  return useRockdAPI("/protected/checkins?person_id=" + personId + "&all=1");
}

function getLithologyCheckins(lith_id) {
  // find way to return more than 5 checkins
  return useRockdAPI("/protected/checkins?lith_id=" + lith_id);
}

function createFilteredItems(arr, set, setClose) {
  return arr.map((item) => {
    return h("li.filter-item", [ 
      h('div', item.name),
      h(Icon, { className: 'red-cross', icon: "cross", style: {color: "red"}, onClick: () => {
          set(arr.filter((person) => person != item));
        } 
      })
    ])
  })
}

function createFilteredNames(result, set, existing, setAutocompleteOpen) {
  return result.map((item) =>
    h('li', {
      onClick: () => {
        if (!existing.includes(item)) {
          setAutocompleteOpen(false);
          set(existing.concat([item]));
        }
      }
    }, item.name)
  )
}