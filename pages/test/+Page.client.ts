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
                    h(Tab, { id: 'all', title: 'All', panelClassName: 'all-tab-panel', panel: h(UsageMap, { mapboxToken: mapboxAccessToken }) }),
                ]
            )
        ]),
        h(Footer)
    ]);
}

mapboxgl.accessToken = SETTINGS.mapboxAccessToken;

function weaverStyle() {
  return {
    sources: {
      usage: {
        type: "vector",
        tiles: [ "http://localhost:5500/stats-tile/{z}/{x}/{y}?cluster=false"],
      }
    },
    layers: [
      {
        id: 'unclustered-point',
        type: 'circle',
        source: 'usage',
        "source-layer": "default",
        paint: {
          'circle-color': "#00f",
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      },
    ],
  };
}

function UsageMap({
  mapboxToken,
}: {
  headerElement?: React.ReactElement;
  title?: string;
  children?: React.ReactNode;
  mapboxToken?: string;
}) {
  const style = useMapStyle(mapboxToken);

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

function useMapStyle(mapboxToken) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";

  const [actualStyle, setActualStyle] = useState(null);
  const overlayStyle = weaverStyle();

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