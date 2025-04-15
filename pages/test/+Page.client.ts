import hyper from "@macrostrat/hyper";

import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner, Icon, Divider } from "@blueprintjs/core";
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
import "./main.sass";
import "@macrostrat/style-system";

const h = hyper.styled(styles);

let count = 0;

export function Page() {
    return h(
        "div.map",
        [
          // The Map Area Container
          h(
            MapAreaContainer,
            {
              className: "map-container",
              style: { "padding-right": "calc(30% + 14px)"}
            },
            [
              h(MapView, { style: 'mapbox://styles/mapbox/satellite-v9', mapboxToken: SETTINGS.mapboxAccessToken }, [
              ]),
              h("div.test")
            ]
          ),
        ]
      );
}