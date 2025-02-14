import h from "@macrostrat/hyper";

import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import {
  LocationPanel,
  MapAreaContainer,
  MapMarker,
  MapView,
  ExpansionPanel,
  buildInspectorStyle,
} from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/mapbox-styles";
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
import { pipeNodeStream } from "vike/dist/esm/node/runtime/html/stream";

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
    let map = mapRef.current;

    const [bounds, setBounds] = useState(map.getBounds());

    // change use map coords
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getEast(), bounds.getWest());

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
  }

  if (result == null) return h(Spinner);
  result = result.success.data;
  console.log("result:",result)

  checkins = createCheckins(result, mapRef, true);
  
  return h("div", {className: 'checkin-container'}, [
      h('div', checkins)
    ]);
}

function createCheckins(result, mapRef, showPin) {
  let checkins = [];
  let map = mapRef?.current;

  result.forEach((checkin) => {
    let pin = null;

    if(showPin) {
      pin = h(Image, 
        { src: "marker_red.png", 
          className: "marker", 
          onClick: () => { 
            console.log("clicked at: ", checkin.lat + " " + checkin.lng);
            map.flyTo({center: [checkin.lng, checkin.lat], zoom: 12});
          } 
        })
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

  const [featuredCheckins, setFeaturedCheckin] = useState(h(Spinner));

  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
  }, []);

  let detailElement = null;
  let selectedCheckin = h('h1', { className: 'no-checkins' }, "No Checkin(s) Selected");
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

  // TODO: have run depend on changing mapRef
  let featuredCheckin = h(FeatureDetails);

  let overlay = h(
    "div.overlay-div",
    [
      h(ExpansionPanel, {title: "Selected Checkins"}, selectedCheckin),
      h(ExpansionPanel, {title: "Featured Checkins"}, featuredCheckin),
    ]);

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

function getSelectedCheckins(result) {
  let checkins = [];
  let mapRef = useMapRef();

  // Selected checkin
  if (result == null) {
    return h(Spinner);
  } else {
    result = result.success.data;
    checkins = createCheckins(result, mapRef, false);

    if (checkins.length > 0) {
      return h("div", {className: 'checkin-container'}, checkins);
    } else {
      return h('h1', { className: 'no-checkins' }, "No Checkin(s) Selected");
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