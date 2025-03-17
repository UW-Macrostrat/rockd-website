import h from "@macrostrat/hyper";

import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner, Icon } from "@blueprintjs/core";
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
import { useCallback, useEffect, useState, useMemo } from "react";
import { tileserverDomain } from "@macrostrat-web/settings";
import "../main.sass";
import { BlankImage, apiURL, useRockdAPI } from "../index";
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
  const style = useMapStyle(type, mapboxToken);
  const [sort, setSort] = useState("likes");

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
      result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast());
    } else {
      result = getCheckins(0, 0, 0, 0);
    }
  
    if (!bounds && map) {
      setBounds(map.getBounds());
    }
  
    count++;
    
    // add selected checkin markers
    useEffect(() => {
      let selectedCheckins = selectedResult?.success.data;
      let selectedCords = [];
      let finalCheckins = null;

      let previousSelected = document.querySelectorAll('.selected_pin');
      previousSelected.forEach((marker) => {
        marker.remove();
      });

      if(selectedCheckins?.length > 0 && inspectPosition) {
        finalCheckins = createCheckins(selectedCheckins, mapRef, "explore/blue-marker.png", sort);

        selectedCheckins.forEach((checkin) => {
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
  
    checkins = createCheckins(result, mapRef, "explore/red-circle.png", sort);

    let selectedCheckins = selectedResult?.success.data;

    if (selectedCheckins?.length > 0 && inspectPosition) {
      console.log("returning selected")
      return h("div", {className: 'checkin-container'}, createCheckins(selectedCheckins, mapRef, "explore/blue-circle.png", sort));
    }
    
    return h("div", {className: 'checkin-container'}, [
        h('div', checkins)
      ]);

    function createCheckins(result, mapRef, marker, sort) {
        let checkins = [];
        const map = mapRef?.current;
        let stop = 0;
    
        let pinClass = "marker-number";
        if (marker.includes("circle")) {
            pinClass = "circle-number";
        }
          
        result.forEach((checkin) => {    
            // format rating
            let ratingArr = [];
            for(var i = 0; i < checkin.rating; i++) {
                ratingArr.push(h(Icon, {className: "star", icon: "star", style: {color: 'white'}}));
            }
        
            for(var i = 0; i < 5 - checkin.rating; i++) {
                ratingArr.push(h(Icon, {className: "star", icon: "star-empty", style: {color: 'white'}}));
            }
            
            let image;
            const showImage = checkin.photo;
        
            if (showImage) {
                image = h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo});
            } else {
                image = h("div", { className: 'no-image' }, [
                    h('h1', "Details"),
                    h(Icon, {className: 'details-image', icon: "arrow-right", style: {color: 'white'}})
                ]);
            }
    
            // for trips
            let stop_name = checkin?.name ?? null;
            let LngLatProps = {
                position: {
                    lat: checkin.lat,
                    lng: checkin.lng
                },
                precision: 3,
                zoom: 10
            };
    
            let temp = h('div', { 
                    className: 'checkin', 
                    onClick: () => { 
                        map.flyTo({center: [checkin.lng, checkin.lat], zoom: 12});
                        setInspectPosition({lat: checkin.lat, lng: checkin.lng});
                        console.log("inspect position set")
                    }, 
                    onMouseEnter: () => {
                        // marker
                        const el = document.createElement('div');
                        el.className = 'marker_pin';
            
                        // Create marker
                        new mapboxgl.Marker(el)
                        .setLngLat([checkin.lng, checkin.lat])
                        .addTo(map);
                    },
                    onMouseLeave: () => {
                        let previous = document.querySelectorAll('.marker_pin');
                        previous.forEach((marker) => {
                            marker.remove();
                        });
                    } 
                }, [
                h('h1', {className: 'stop-name'}, stop_name),
                h('div', {className: 'checkin-header'}, [
                    h('h3', {className: 'profile-pic'}, h(BlankImage, {src: apiURL + "protected/gravatar/" + checkin.person_id, className: "profile-pic"})),
                    h('div', {className: 'checkin-info'}, [
                        h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
                        h('h4', {className: 'edited'}, checkin.created),
                        h('p', "Near " + checkin.near),
                        LngLatCoords(LngLatProps),
                        h('h3', {className: 'rating'}, ratingArr),
                    ]),
                    // pin,
                    ]),
                    h('p', {className: 'description'}, checkin.notes),
                    h('a', {className: 'checkin-link', href: "/checkin/" + checkin.checkin_id, target: "_blank"}, [
                    image,
                    showImage ? h('div', {className: "image-details"}, [
                        h('h1', "Details"),
                        h(Icon, {className: 'details-image', icon: "arrow-right", style: {color: 'white'}})
                    ]) : null
                    ]),
                    h('div', {className: 'checkin-footer'}, [
                    h('div', {className: 'likes-container'}, [
                        h(Icon, {className: 'likes-icon', icon: "thumbs-up", style: {color: 'white'}}),
                        h('h3', {className: 'likes'}, checkin.likes),
                    ]),
                    h('div', {className: 'observations-container'}, [
                        h(Icon, {className: 'observations-icon', icon: "camera", style: {color: 'white'}}),
                        h('h3', {className: 'likes'}, checkin.observations.length),
                    ]),
                    h('div', {className: 'comments-container'}, [
                        h(Icon, {className: 'comments-icon', icon: "comment", style: {color: 'white'}}),
                        h('h3', {className: 'comments'}, checkin.comments),
                    ])
                ]),
            ]);
            
            checkins.push(temp);
        });
        
        return checkins;
    }
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

  if (inspectPosition && selectedResult?.success.data.length > 0) {
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
          setOpenSelected(false)
          setInspectPosition(null);
        }
      }, "X"),
      h("div.overlay-div", featuredCheckin),
    ]);
  } else {
    overlay = h("div.sidebox", [
      h('div.sidebox-header', [
        h('div.title', [
          h("h1", "Featured Checkins"),
          h(DarkModeButton, { className: "dark-btn", showText: true } )
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
          contextPanelOpen: false,
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
    const overlayStyle = mergeStyles(_macrostratStyle, weaverStyle(type));
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
  return useRockdAPI("protected/checkins?minlat=" + minLat + 
    "&maxlat=" + maxLat +
    "&minlng=" + minLng +
    "&maxlng=" + maxLng);
}

function getPersonCheckins(personId) {
  return useRockdAPI("protected/checkins?person_id=" + personId);
}

function getTaxonCheckins(taxonId) {
  // not sure how to use api yet
  return useAPIResult("https://rockd.org/api/v1/protected/checkins?taxon_id=" + taxonId);
}