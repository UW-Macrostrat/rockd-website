/**
 * A development interface for the "Weaver" point data server.
 */

import h from "@macrostrat/hyper";

import { useMapRef } from "@macrostrat/mapbox-react"; // Ensure this is imported
import { Button, MenuItem, Spinner } from "@blueprintjs/core";
import { Select2 } from "@blueprintjs/select";
import { SETTINGS } from "@macrostrat-web/settings";
import {
  FeatureProperties,
  FloatingNavbar,
  LocationPanel,
  MapAreaContainer,
  MapLoadingButton,
  MapMarker,
  MapView,
  ExpansionPanel,
  buildInspectorStyle,
} from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import {
  DarkModeButton,
  Spacer,
  useAPIResult,
  useDarkMode,
} from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { mapboxAccessToken, tileserverDomain } from "@macrostrat-web/settings";
import "./main.styl";
import { BlankImage, Image } from "../index";
import { M } from "vite/dist/node/types.d-aGj9QkWt";
import { map } from "underscore";

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
      },
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
  const mapRef = useMapRef();
  let checkins = [];
  let result;

  if(mapRef == null) {
    result = getCheckins(0, 100, 0, 100);
  } else {
    let bounds = mapRef.current?.getBounds();

    // change use map coords
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getEast(), bounds.getWest());
  }

  if (result == null) return h(Spinner);
  result = result.success.data;

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
    }
    

    let temp = h('a', {className: 'checkin-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id}, [
      h('div', { className: 'checkin' }, [
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
        image
      ]),
    ]);
      
    checkins.push(temp);
  });
  

  return h("div", {className: 'checkin-container'}, [
      h('div', checkins)
    ]);
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

  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
  }, []);

  let detailElement = null;
  let selectedCheckin = null;
  let checkins = [];
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

    // Left Panel
    if (result == null) {
      selectedCheckin = h(Spinner);
    } else {
      result = result.success.data;
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
       }
       
   
       let temp = h('a', {className: 'checkin-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id}, [
         h('div', { className: 'checkin' }, [
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
           image
         ]),
       ]);

       checkins.push(temp);
     });

     selectedCheckin = h("div", {className: 'checkin-container'}, checkins);
    }
  }

  // TODO: have run depend on changing mapRef
  let featuredCheckin = h(FeatureDetails);

  let overlay = h("div.overlay-div", [
    h(ExpansionPanel, {title: "Selected Checkins"}, h('h1', { className: 'no-checkins' }, "No Checkin(s) Selected")),
    h(ExpansionPanel, {title: "Featured Checkins"}, featuredCheckin),
  ]);

  if (checkins.length > 0) {
    overlay = h(
      "div.overlay-div",
      [
        h(ExpansionPanel, {title: "Selected Checkins"}, selectedCheckin),
        h(ExpansionPanel, {title: "Featured Checkins"}, featuredCheckin),
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
          detailPanel: detailElement,
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
  }, []);

  return actualStyle;
}