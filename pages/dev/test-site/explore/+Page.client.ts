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
import { useDarkMode } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { tileserverDomain } from "@macrostrat-web/settings";
import "./main.styl";

import { getCheckins, createFeaturedCheckins, getSelectedCheckins, formatCoordinates } from "./storybook"; // test for storybook


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

  checkins = createFeaturedCheckins(result, mapRef);
  
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