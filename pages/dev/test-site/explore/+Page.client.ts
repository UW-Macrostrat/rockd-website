import h from "@macrostrat/hyper";

import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import {
  LocationPanel,
  MapAreaContainer,
  MapMarker,
  MapView,
  buildInspectorStyle,
} from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import {
  useAPIResult,
  useDarkMode,
} from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { tileserverDomain } from "@macrostrat-web/settings";
import "./main.styl";
import { BlankImage, Image } from "../index";

import {} from "./storybook";
import { get } from "underscore";

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

function imageExists(image_url){
  var http = new XMLHttpRequest();

  http.open('HEAD', image_url, false);
  http.send();

  return http.status != 404;
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

function FeatureDetails() {
  // return null;
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [bounds, setBounds] = useState(map?.getBounds());
  let checkins = [];
  let result;

  if(!map) {
    console.log("Map not loaded");
    result = getCheckins(0, 0, 0, 0);
    return h(Spinner); 
  } else if (bounds) {
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast());
  } else {
    result = getCheckins(0, 0, 0, 0);
  }

  if (!bounds) {
    setBounds(map.getBounds());
  }

  count++;

  // change use map coords
  //let distance = Math.abs(bounds.getEast() - bounds.getWest());
  //let newWest = bounds.getWest() + distance * .3;
  
  if(result != null) {
    // get featured checkins coordinates
    let features = [];
    let coordinates = [];

    result.success.data.forEach((checkin) => {
      /*
      features.push({
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [checkin.lng, checkin.lat]
        },
        "properties": {}
      });
      */

      coordinates.push([checkin.lng, checkin.lat]);
    });

    /*
    // delete unneeded layers
    let layers = map.getStyle().layers;
    layers.forEach((layer) => {
      if (layer.id.includes('geojson')) {
        // Remove the layer
        map.removeLayer(layer.id);

        // Remove the source associated with this layer (if any)
        if (map.getSource(layer.source)) {
          map.removeSource(layer.source);
        }
      }
    });

    */

    let previous = document.querySelectorAll('.marker_pin');
    previous.forEach((marker) => {
      marker.remove();
    });

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
    
    /*
    // add source
    map.addSource("test" + count, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: features,
      },
    });

    // add layer
    map.addLayer({
        id: "geojson" + count,
        type: "circle",
        source: "test" + count,
        paint: {
          "circle-radius": 10,
          "circle-color": '#ff0000',
          "circle-stroke-width": 2,
          "circle-stroke-color": '#ffffff',
        }
      });
      */
  }
/*
  // Update bounds on move
  useEffect(() => {
    const listener = () => {
      setBounds(map.getBounds());
    };
    map.on("moveend", listener);
    return () => {
      map.off("moveend", listener);
    };
  }, [bounds]);
  */

  if (result == null) return h("div.checkin-container",Spinner);
  result = result.success.data;  

  checkins = createCheckins(result, mapRef, true);
  
  return h("div", {className: 'checkin-container'}, [
      h('div', checkins)
    ]);
}

function createCheckins(result, mapRef, showPin) {
  let checkins = [];
  let map = mapRef?.current;
  let stop = 0;

  result.forEach((checkin) => {
    let pin = null;

    if(showPin) {
      stop++;
      pin = h('div', 
        { src: "marker_container.png", 
          className: "marker_container", 
          onClick: () => { 
            map.flyTo({center: [checkin.lng, checkin.lat], zoom: 12});
          } 
        }, [
          h(Image, { src: "marker_red.png", className: "marker" }),
          h('span', { className: "marker-number" }, stop)
        ])
    }


    // format rating
    let ratingArr = [];
    for(var i = 0; i < checkin.rating; i++) {
        ratingArr.push(h(Image, {className: "star", src: "blackstar.png"}));
    }

    for(var i = 0; i < 5 - checkin.rating; i++) {
      ratingArr.push(h(Image, {className: "star", src: "emptystar.png"}));
    }
    let image;

    if (imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo)) {
      image = h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo});
    } else {
      image = h(Image, { className: 'observation-img', src: "rockd.jpg"});
    }
    

    let temp = h('div', { className: 'checkin' }, [
        h('div', {className: 'checkin-header'}, [
          h('h3', {className: 'profile-pic'}, h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + checkin.person_id, className: "profile-pic"})),
          h('div', {className: 'checkin-info'}, [
              h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
              h('h4', {className: 'edited'}, checkin.created),
              h('p', "Near " + checkin.near),
              h('h3', {className: 'rating'}, ratingArr),
          ]),
          pin,
        ]),
        h('p', {className: 'description'}, checkin.notes),
        h('a', {className: 'checkin-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id, target: "_blank"}, [
          image,
          h('div', {className: "image-details"}, [
            h('h1', "Details"),
            h(Image, {className: 'details-image', src: "explore/white-arrow.png"})
          ])
        ]),
        h('div', {className: 'checkin-footer'}, [
          h('div', {className: 'likes-container'}, [
            h(Image, {className: 'likes-image', src: "explore/thumbs-up.png"}),
            h('h3', {className: 'likes'}, checkin.likes),
          ]),
          h('div', {className: 'observations-container'}, [
            h(Image, {className: 'observations-image', src: "explore/observations.png"}),
            h('h3', {className: 'comments'}, checkin.observations.length),
          ]),
          h('div', {className: 'comments-container'}, [
            h(Image, {className: 'comments-image', src: "explore/comment.png"}),
            h('h3', {className: 'comments'}, checkin.comments),
          ])
        ]),
      ]);
      
    checkins.push(temp);
  });

  return checkins;
}

function createSelectedCheckins(result) {
  let checkins = [];

  result.forEach((checkin) => {
    // format rating
    let ratingArr = [];
    for(var i = 0; i < checkin.rating; i++) {
        ratingArr.push(h(Image, {className: "star", src: "blackstar.png"}));
    }

    for(var i = 0; i < 5 - checkin.rating; i++) {
      ratingArr.push(h(Image, {className: "star", src: "emptystar.png"}));
    }
    let image;

    if (imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo)) {
      image = h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo});
    } else {
      image = h(Image, { className: 'observation-img', src: "rockd.jpg"});
    }
    

    let temp = h('div', { className: 'checkin' }, [
        h('div', {className: 'checkin-header'}, [
          h('h3', {className: 'profile-pic'}, h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + checkin.person_id, className: "profile-pic"})),
          h('div', {className: 'checkin-info'}, [
              h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
              h('h4', {className: 'edited'}, checkin.created),
              h('p', "Near " + checkin.near),
              h('h3', {className: 'rating'}, ratingArr),
          ]),
        ]),
        h('p', {className: 'description'}, checkin.notes),
        h('a', {className: 'checkin-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id, target: "_blank"}, [
          image,
          h('div', {className: "image-details"}, [
            h('h1', "Details"),
            h(Image, {className: 'details-image', src: "explore/white-arrow.png"})
          ])
        ]),
        h('div', {className: 'checkin-footer'}, [
          h('div', {className: 'likes-container'}, [
            h(Image, {className: 'likes-image', src: "explore/thumbs-up.png"}),
            h('h3', {className: 'likes'}, checkin.likes),
          ]),
          h('div', {className: 'observations-container'}, [
            h(Image, {className: 'observations-image', src: "explore/observations.png"}),
            h('h3', {className: 'comments'}, checkin.observations.length),
          ]),
          h('div', {className: 'comments-container'}, [
            h(Image, {className: 'comments-image', src: "explore/comment.png"}),
            h('h3', {className: 'comments'}, checkin.comments),
          ])
        ]),
      ]);
      
    checkins.push(temp);
  });

  return checkins;
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

  // overlay
  const [isOpenSelected, setOpenSelected] = useState(true);

  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
    setOpenSelected(true);
  }, []);

  let detailElement = null;
  let selectedCheckin = null;
  let result = getCheckins(inspectPosition?.lat - .05, inspectPosition?.lat + .05, inspectPosition?.lng - .05, inspectPosition?.lng + .05);
  if (inspectPosition != null) {
    detailElement = h(
      LocationPanel,
      {
        onClose() {
          setInspectPosition(null);
        },
        position: inspectPosition,
      },
    );

    // Get sleected checkins
    selectedCheckin = getSelectedCheckins(result);
  }

  let featuredCheckin = h(FeatureDetails);
  let overlay;

  if (selectedCheckin == null || !isOpenSelected) {
    overlay = h("div.sidebox", [
      h('div.title', h("h1", "Featured Checkins")),
      h("div.overlay-div", featuredCheckin),
    ]);
  } else {
    overlay = h("div.sidebox", [
      h('div.title', [
        h("h1", "Selected Checkins"),
        h('h3', { className: "coordinates" }, formatCoordinates(inspectPosition.lat, inspectPosition.lng)),
      ]),
      h("button", {
        className: "close-btn",
        onClick: () => setOpenSelected(false)
      }, "X"),
      h("div.overlay-div", selectedCheckin)
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

function getSelectedCheckins(result) {
  let checkins = [];

  // Selected checkin
  if (result == null) {
    return null;
  } else {
    result = result.success.data;
    checkins = createSelectedCheckins(result);

    if (checkins.length > 0) {
      return h("div", {className: 'checkin-container'}, checkins);
    } else {
      return null;
    }
  }
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
  }, []);

  return actualStyle;
}

function formatCoordinates(latitude, longitude) {
  // Round latitude and longitude to 4 decimal places
  const roundedLatitude = latitude.toFixed(4);
  const roundedLongitude = longitude.toFixed(4);

  const latitudeDirection = latitude >= 0 ? 'N' : 'S';
  const longitudeDirection = longitude >= 0 ? 'E' : 'W';

  // Return the formatted string with rounded values
  return `${Math.abs(roundedLatitude)}° ${latitudeDirection}, ${Math.abs(roundedLongitude)}° ${longitudeDirection}`;
}