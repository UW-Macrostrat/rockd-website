import h from "@macrostrat/hyper";

import { useMap, useMapRef } from "@macrostrat/mapbox-react";
import { Divider, Spinner } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import {
  MapAreaContainer,
  MapMarker,
  MapView,
  buildInspectorStyle,
} from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import { useDarkMode, useAPIResult, DarkModeButton } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { tileserverDomain } from "@macrostrat-web/settings";
import "../main.styl";
import { createCheckins, Image } from "../index";
import "./main.sass";
import "@macrostrat/style-system";
import { LngLatCoords } from "@macrostrat/map-interface";

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

const types = [
  {
    id: "Sample",
    name: "Sample",
    color: "purple",
  },
];

function weaverStyle(type: object) {
  const color = type?.color ?? "dodgerblue";
  return {
    sources: {
      weaver: {
        type: "vector",
        tiles: [ tileserverDomain + "/checkins/tiles/{z}/{x}/{y}"],
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
  const [isOpen, setOpen] = useState(false);

  const [type, setType] = useState(types[0]);

  const style = useMapStyle(type, mapboxToken);
  const [sort, setSort] = useState("likes");
  const [searchValue, setSearchValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // overlay
  const [isOpenSelected, setOpenSelected] = useState(true);

  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
    setOpenSelected(true);
  }, []);

  let selectedResult = getCheckins(inspectPosition?.lat - .05, inspectPosition?.lat + .05, inspectPosition?.lng - .05, inspectPosition?.lng + .05);

  function FeatureDetails() {
    // return null;
    const mapRef = useMapRef();
    const map = mapRef.current;
    const [bounds, setBounds] = useState(map?.getBounds());
    let checkins = [];
    let result;
  
    if(!map) {
      result = getCheckins(0, 0, 0, 0);
    } else if (bounds) {
      let distance = Math.abs(bounds.getEast() - bounds.getWest());
      let newWest = bounds.getWest() + distance * .3;
      result = getCheckins(bounds.getSouth(), bounds.getNorth(), newWest, bounds.getEast());
    } else {
      result = getCheckins(0, 0, 0, 0);
    }
  
    if (!bounds && map) {
      setBounds(map.getBounds());
    }
  
    count++;
    
    if(result != null) {
      // get featured checkins coordinates
      let coordinates = [];
  
      result.success.data.forEach((checkin) => {
        coordinates.push([checkin.lng, checkin.lat]);
      });
  
      let previous = document.querySelectorAll('.marker_pin');
      previous.forEach((marker) => {
        marker.remove();
      });
      
      if (!selectedResult || selectedResult?.success.data.length == 0 || !isOpenSelected) {
        let stop = 0;
        coordinates.forEach((coord) => {
          stop++;
          // marker
          const el = document.createElement('div');
          el.className = 'marker_pin';
    
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
    }

    // add selected checkin markers
    useEffect(() => {
      let selectedCheckins = selectedResult?.success.data;
      let selectedCords = [];
      let finalCheckins = null;

      let previousSelected = document.querySelectorAll('.selected_pin');
      previousSelected.forEach((marker) => {
        marker.remove();
      });

      if(selectedCheckins?.length > 0 && isOpenSelected) {
        finalCheckins = createCheckins(selectedCheckins, mapRef, "explore/blue-marker.png", sort);

        selectedCheckins.forEach((checkin) => {
          selectedCords.push([checkin.lng, checkin.lat]);
        });

        let selectedStop = 0;
        selectedCords.forEach((coord) => {
          console.log("selected cords", coord);
          selectedStop++;
          // marker
          const el = document.createElement('div');
          el.className = 'selected_pin';

          const number = document.createElement('span');
          number.innerText = selectedStop;

          // Append the number to the marker
          el.appendChild(number);

          // Create marker
          new mapboxgl.Marker(el)
            .setLngLat(coord)
            .addTo(map);
        });
      }
    }, [selectedResult]);
  
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
  
    if (result == null) return h("div.checkin-container",Spinner);
    result = result.success.data;  
  
    checkins = createCheckins(result, mapRef, "explore/red-circle.png", sort);

    let selectedCheckins = selectedResult?.success.data;

    if (selectedCheckins?.length > 0 && isOpenSelected) {
      return h("div", {className: 'checkin-container'}, createCheckins(selectedCheckins, mapRef, "explore/blue-circle.png", sort));
    }
    
    return h("div", {className: 'checkin-container'}, [
        h('div', checkins)
      ]);
  }

  let featuredCheckin = h(FeatureDetails);
  let overlay;

  let LngLatProps = {
    position: {
        lat: inspectPosition?.lat ?? 0,
        lng: inspectPosition?.lng ?? 0
    },
    precision: 3,
    zoom: 10
  };

  const handleChange = (event) => {
    setSort(event.target.value);
  };

  const handleInputChange = (event) => {
    setSearchValue(event.target.value); 
    setShowAutocomplete(true);
  };

  let dropdown = h('select', { className: "sort-dropdown", onChange: handleChange }, [
    h('option', { value: "likes" }, "Likes"),
    h('option', { value: "created" }, "Date Created"),
    h('option', { value: "added" }, "Date Added"),
  ]);

  let sortContainer = h('div.sort-container', [
    h(DarkModeButton, { className: "dark-button", showText: true, minimal: true }),
    h('h3', "Sort By:"),
    dropdown,
  ]);

  let searchBar = h('div.search-bar', [
    h('input', { type: "text", placeholder: "Filter Checkins", onChange: handleInputChange }),
    h('div.search-icon', [
      h(Image, { src: "explore/search-icon.png" }),
    ]),
    h('div.x-icon', [
      h(Image, { className: 'x-icon', src: "explore/x-button.png", onClick: () => {
        console.log("clicked");
        let input = document.querySelector('input');
        input.value = "";
        // setSearchValue(''); deosnt work
        } 
      }),
    ]),
  ]);

  let autoComplete = AutoComplete(searchValue, showAutocomplete);

  if (selectedResult?.success.data?.length > 0 && isOpenSelected) {
    overlay = h("div.sidebox", [
      h('div.title', [
        h('div', { className: "selected-center" }, [
          h("h1", "Selected Checkins"),
          h('h3', { className: "coordinates" }, LngLatCoords(LngLatProps)),
        ]),
      ]),
      searchBar,
      sortContainer,
      h("button", {
        className: "close-btn",
        onClick: () => setOpenSelected(false)
      }, "X"),
      h("div.overlay-div", featuredCheckin),
    ]);
  } else {
    overlay = h("div.sidebox", [
      h('div.sidebox-header', [
        h('div.title', [
          h("h1", "Featured Checkins"),
        ]),
        searchBar,
        autoComplete,
        sortContainer,
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
          contextPanelOpen: isOpen,
        },
        [
          h(MapView, { style, mapboxToken }, [
            h(MapMarker, {
              position: inspectPosition,
              setPosition: onSelectPosition,
            }),
          ]),

          // The Overlay Div
          overlay,
        ]
      ),
    ]
  );
  
}

function useMapStyle(type, mapboxToken) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";

  const [actualStyle, setActualStyle] = useState(null);

  // Auto select sample type
  useEffect(() => {
    const overlayStyle = mergeStyles(_macrostratStyle, weaverStyle(types[0]));
      buildInspectorStyle(baseStyle, overlayStyle, {
        mapboxToken,
        inDarkMode: isEnabled,
      }).then((s) => {
        setActualStyle(s);
      });
  }, [isEnabled]);

  return actualStyle;
}

function getCheckins(lat1, lat2, lng1, lng2) {
  // abitrary bounds around click point
  let minLat = Math.floor(lat1 * 100) / 100;
  let maxLat = Math.floor(lat2 * 100) / 100;
  let minLng = Math.floor(lng1 * 100) / 100;
  let maxLng = Math.floor(lng2 * 100) / 100;

  // change use map coords
  return useAPIResult("https://rockd.org/api/v2/protected/checkins?minlat=" + minLat + 
    "&maxlat=" + maxLat +
    "&minlng=" + minLng +
    "&maxlng=" + maxLng);
}

function getPersonCheckins(personId) {
  return useAPIResult("https://rockd.org/api/v2/protected/checkins?person_id=" + personId);
}


function AutoComplete(input, showAutocomplete) {
  const [filters, setFilters] = useState([]);
  const [autocompleteOpen, setAutocompleteOpen] = useState(true);
  console.log("input", input, " show", autocompleteOpen);

  let result = null;

  try {
    result = useAPIResult("https://rockd.org/api/v2/autocomplete/" + input);
  } catch (e) {
    return null;
  }

  if(result == null) return null;
  result = result.success.data;

  let filterContainer = filters.length != 0 ? h("div.filter-container", [
    h('h2', "Filters"),
    h('ul', filters.map((item) => {
      return h('li', item.name);
    }))
  ]) : null; 

  let taxa = result.taxa.length > 0  && autocompleteOpen ? h('div.taxa', [  
      h('h2', "Taxa"),
      h('ul', result.taxa.map((item) => {
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

  return h('div.autocomplete', [
    filterContainer,
    h('p', "Search Results"),
    taxa,
    people,
  ]);
}