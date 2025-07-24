import { Divider } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import {buildInspectorStyle } from "@macrostrat/map-interface";
import { useDarkMode } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useEffect, useState } from "react";
import h from "./main.module.sass";
import "@macrostrat/style-system";
import { MapPosition } from "@macrostrat/mapbox-utils";
import {
  MapAreaContainer,
  MapView,
} from "@macrostrat/map-interface";
import { mapboxAccessToken } from "@macrostrat-web/settings";
import { Footer } from "~/components/general";
import { Tabs, Tab } from "@blueprintjs/core";
import { mergeStyles } from "@macrostrat/mapbox-utils";

const tileServer = 'http://localhost:5500';

export function Page() {
    return h('div.main', [
        h('div.heatmap-page', [
            h(PageHeader),
            h(
                Tabs,
                {
                    id: 'heatmap-tabs',
                },
                [
                  h(Tab, { id: 'all', title: 'All', panelClassName: 'all-tab-panel', panel: h(Heatmap, { mapboxToken: mapboxAccessToken, today: false }) }),
                  h(Tab, { id: 'today', title: 'Today', panelClassName: 'today-tab-panel', panel: h(Heatmap, { mapboxToken: mapboxAccessToken, today: true }) }),
                ]
            )
        ]),
        h(Footer)
    ]);
}

mapboxgl.accessToken = SETTINGS.mapboxAccessToken;

function todayStyle() {
  return {
    sources: {
      today: {
        type: "vector",
        tiles: [ tileServer + "/stats-tile/{z}/{x}/{y}?date=today" ],
      }
    },
    layers: [
      {
        id: 'today-points',
        type: 'circle',
        source: 'today',
        "source-layer": "default",
        paint: {
          'circle-color': "#6488ea",
          'circle-radius': 4,
        }
      },
    ],
  };
}

function allStyle() {
  return {
    sources: {
      all: {
        type: "vector",
        tiles: [ tileServer + "/stats-tile/{z}/{x}/{y}" ],
      }
    },
    layers: [
      {
        id: 'all-points',
        type: 'circle',
        source: 'all',
        "source-layer": "default",
        paint: {
          'circle-color': "#5e5e5e",
          'circle-radius': 4,
        }
      },
    ],
  };
}

function Heatmap({
  mapboxToken,
  today,
}: {
  mapboxToken: string;
  today: boolean;
}) {
  const style = useMapStyle(mapboxToken, today);

  if(style == null) return null;

  const mapPosition: MapPosition = {
          camera: {
            lat: 39, 
            lng: -98, 
            altitude: 6000000,
          },
        };

  return h(MapContainer, {style, mapPosition});
}

function useMapStyle(mapboxToken, today) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";

  const [actualStyle, setActualStyle] = useState(null);
  const overlayStyle = today ? todayStyle() : mergeStyles(allStyle(), todayStyle());

  // Auto select sample type
  useEffect(() => {
      buildInspectorStyle(baseStyle, overlayStyle, {
        mapboxToken,
        inDarkMode: isEnabled,
      }).then((s) => {
        setActualStyle(s);
      });
  }, [isEnabled]);

  return actualStyle;
}

export function MapContainer({style, mapPosition}) {
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
              h(MapView, { style, mapboxToken: mapboxAccessToken, mapPosition }),
            ]
          ),
        ]
      );
}


function PageHeader() {
    return h('div.page-header', [
        h('h1', 'Heatmap'),
        h(Divider),
        h('p', 'This is a heatmap of all the locations where Macrostrat has been accessed.'),
        h('p', 'The blue markers indicate today\'s accesses, while the grey markers indicate accesses from other days.'),
    ]);
}