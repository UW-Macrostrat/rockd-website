import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner, Icon, Divider, Button } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import {buildInspectorStyle } from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import { useDarkMode, DarkModeButton } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState, useMemo } from "react";
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

function getCheckins(lat1, lat2, lng1, lng2, page) {
  // abitrary bounds around click point
  let minLat = Math.floor(lat1 * 100) / 100;
  let maxLat = Math.floor(lat2 * 100) / 100;
  let minLng = Math.floor(lng1 * 100) / 100;
  let maxLng = Math.floor(lng2 * 100) / 100;

  // change use map coords
  return useRockdAPI("/protected/checkins?minlat=" + minLat + 
    "&maxlat=" + maxLat +
    "&minlng=" + minLng +
    "&maxlng=" + maxLng + 
    "&page="  + page);
}

function FeatureDetails({setInspectPosition}) {
  const [page, setPage] = useState(1);
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [bounds, setBounds] = useState(map?.getBounds());
  let checkins = [];
  let result;
  let nextData;

  if (bounds) {
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast(), page);
    nextData = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast(), page + 1);
  } else {
    result = getCheckins(0, 0, 0, 0, 1);
    nextData = getCheckins(0, 0, 0, 0, 2);
  }

  if (!bounds && map) {
    setBounds(map.getBounds());
  }

  useEffect(() => {
    if (!map) return;

    const handleMapReady = () => {
      const newBounds = map.getBounds();
      setBounds(newBounds);
      setPage(1);
    };

    if (map.isStyleLoaded()) {
      handleMapReady(); 
    } else {
      map.once("load", handleMapReady); 
    }

    const onMoveEnd = () => {
      const newBounds = map.getBounds();
      setBounds(newBounds);
      setPage(1);
    };

    map.on("moveend", onMoveEnd);

    return () => {
      map.off("moveend", onMoveEnd);
      map.off("load", handleMapReady);
    };
  }, [map]);


  result = result?.success?.data;  
  if (result == null || result.length === 0) return h(Spinner, { className: "loading-spinner" });

  const pages = pageCarousel({page, setPage, nextData: nextData?.success.data});

  result.sort((a, b) => {
    if (a.photo === null && b.photo !== null) return 1;
    if (a.photo !== null && b.photo === null) return -1;
    return 0;
  });

  checkins = createCheckins(result, mapRef, setInspectPosition);
  
  return h("div", {className: 'checkin-container'}, [
      checkins,
      pages
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

function AutoComplete({setFilteredData, autocompleteOpen, setAutocompleteOpen}) {
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [input, setInput] = useState('');
  const [close, setClose] = useState(false);  
  const [page, setPage] = useState(1);

  // test 
  const [peopleIds, setPeople] = useState([]);
  const [structures, setStructures] = useState([]);
  const [lithologyAttributes, setLithologyAttributes] = useState([]);
  const [stratNameOrphans, setStratNameOrphans] = useState([]);
  const [lithologyIds, setLithologies] = useState([]);
  // const [taxaIds, setTaxa] = useState([]); // fails
  // const [intervalIds, setIntervals] = useState([]); // fails
  // const [stratNameConcepts, setStratNameConcepts] = useState([]); // fails
  // const [minerals, setMinerals] = useState([]); // fails
  // const [lithologyTypes, setLithologyTypes] = useState([]); // doesn't exist
  // const [lithologyClasses, setLithologyClasses] = useState([]); // doesn't exist

  const lithParam = "lith_id=" + lithologyIds.map(item => item.id).join(',');
  const peopleParam = "person_id=" + peopleIds.map(item => item.id).join(',');
  const stratNameOrphanParam = "strat_name_orphan_id=" + stratNameOrphans.map(item => item.id).join(',');
  const lithologyAttributeParam = "lith_att_id=" + lithologyAttributes.map(item => item.id).join(',');
  const structureParam = "structure_id=" + structures.map(item => item.id).join(',');
  // const taxaParam = "taxon_id=" + taxaIds.map(item => item.id).join(','); // fails
  // const intervalParam = "int_id=" + intervalIds.map(item => item.id).join(','); // fails
  // const stratNameConceptParam = "strat_name_concept_id=" + stratNameConcepts.map(item => item.id).join(','); // fails
  // const mineralParam = "mineral_id=" + minerals.map(item => item.id).join(','); // fails
  // const lithologyTypeParam = "=" + lithologyTypes.map(item => item.id).join(','); // doesn't exist
  // const lithologyClassParam = "=" + lithologyClasses.map(item => item.id).join(','); // doesn't exist

  // develop query
  const finalParams = useMemo(() => {
  const params = [
      lithParam,
      peopleParam,
      lithologyAttributeParam,
      stratNameOrphanParam,
      structureParam
    ].filter(param => /\d/.test(param));

    return params.join('&');
  }, [lithologyIds, peopleIds, lithologyAttributes, stratNameOrphans, structures]);

  const queryString = useMemo(() => {
    return finalParams ? `/protected/checkins?${finalParams}` : null;
  }, [finalParams]);


  // get data
  const data = useRockdAPI(queryString + "&page=" + page)?.success.data;
  const nextData = useRockdAPI(queryString + "&page=" + (page + 1))?.success.data;

  // add markers for filtered checkins
  let coordinates = [];
  let lngs = [];
  let lats = [];

  useEffect(() => {
    if(data && data.length > 0 && queryString) {
      setFilteredData({
        current: data,
        next: {
          data: nextData,
          page: page,
          setPage: setPage
        }
      });

      data.forEach((checkin) => {
        coordinates.push([checkin.lng, checkin.lat]);
        lngs.push(checkin.lng);
        lats.push(checkin.lat);
      });

      deletePins('.filtered_pin');

      if (!close) {
        let stop = 0;
        coordinates.forEach((coord) => {
          stop++;
          // marker
          const el = document.createElement('div');
          el.className = 'filtered_pin';
          el.style.backgroundColor = 'green';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';
          el.style.width = '15px';
          el.style.height = '15px';

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
      deletePins('.filtered_pin');

      setFilteredData(null);
    }
  }, [data, nextData, queryString]);

  // rest
  const handleInputChange = (event) => {
    setAutocompleteOpen(true);
    setInput(event.target.value); 
    setClose(false);
    setPage(1);
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
          setPage(1);
          deletePins('.filtered_pin');
        } 
      }),
    ]),
  ]);

  const sectionConfigs = [
    { label: 'People', data: peopleIds, setter: setPeople },
    { label: 'Strat Name Orphans', data: stratNameOrphans, setter: setStratNameOrphans },
    { label: 'Structures', data: structures, setter: setStructures },
    { label: 'Lithologies', data: lithologyIds, setter: setLithologies },
    { label: 'Lithology Attributes', data: lithologyAttributes, setter: setLithologyAttributes },
    // { label: 'Taxa', data: taxaIds, setter: setTaxa },
    // { label: 'Intervals', data: intervalIds, setter: setIntervals },
    // { label: 'Lithology Types', data: lithologyTypes, setter: setLithologyTypes },
    // { label: 'Lithology Classes', data: lithologyClasses, setter: setLithologyClasses },
    // { label: 'Strat Name Concepts', data: stratNameConcepts, setter: setStratNameConcepts },
    // { label: 'Minerals', data: minerals, setter: setMinerals },
  ];
  
  const sections = sectionConfigs
    .filter(({ data }) => data.length > 0)
    .map(({ label, data, setter }) =>
      h('div', [
        h('h3', label),
        createFilteredItems(data, setter, setPage)
      ])
    );

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
    const lithologies = renderSection("Lithologies", "lithologies", result?.lithologies, setLithologies, lithologyIds, setAutocompleteOpen);
    const strat_name_orphans = renderSection("Stratigraphic Name Orphans", "strat_name_orphans", result?.strat_name_orphans, setStratNameOrphans, stratNameOrphans, setAutocompleteOpen);
    const structures_items = renderSection("Structures", "structures", result?.structures, setStructures, structures, setAutocompleteOpen);
    const lithology_attributes = renderSection("Lithology Attributes", "lithology_attributes", result?.lithology_attributes, setLithologyAttributes, lithologyAttributes, setAutocompleteOpen);
    const people = renderSection("People", "people", result?.people, setPeople, peopleIds, setAutocompleteOpen);
    // sections commented out that don't work or don't exist
    // const intervals = renderSection("Intervals", "intervals", result?.intervals, setIntervals, intervalIds, setAutocompleteOpen);
    // const lithology_types = renderSection("Lithology Types", "lithology_types", result?.lithology_types, setLithologyTypes, lithologyTypes, setAutocompleteOpen);
    // const lithology_classes = renderSection("Lithology Classes", "lithology_classes", result?.lithology_classes, setLithologyClasses, lithologyClasses, setAutocompleteOpen);
    // const strat_name_concepts = renderSection("Stratigraphic Name Concepts", "strat_name_concepts", result?.strat_name_concepts, setStratNameConcepts, stratNameConcepts, setAutocompleteOpen);
    // const minerals_items = renderSection("Minerals", "minerals", result?.minerals, setMinerals, minerals, setAutocompleteOpen);
    // const taxa = renderSection("Taxa", "taxa", result?.taxa, setTaxa, taxaIds, setAutocompleteOpen);

    // result
    results = h('div.results', [
      people,
      lithologies,
      lithology_attributes,
      strat_name_orphans,
      structures_items,
      // minerals_items,
      // taxa,
      // intervals,
      // strat_name_concepts,
      // lithology_types,
      // lithology_classes,
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

function createFilteredItems(arr, set, setPage) {
  return arr.map((item) => {
    return h("li.filter-item", [ 
      h('div', item.name),
      h(Icon, { className: 'red-cross', icon: "cross", style: {color: "red"}, onClick: () => {
          set(arr.filter((person) => person != item));
          setPage(1);
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

function deletePins(str) {
  let previous = document.querySelectorAll(str);
  previous.forEach((marker) => {
    marker.remove();
  });
}

function renderSection(label, key, resultList, setFn, existingIds, setAutocompleteOpen) {
  return resultList?.length > 0
    ? h(`div.${key}`, [
        h('h2', label),
        h('ul', createFilteredNames(resultList, setFn, existingIds, setAutocompleteOpen))
      ])
    : null;
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