import h from "@macrostrat/hyper";

import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner, Icon, Divider, Button } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import {
  MapAreaContainer,
  MapMarker,
  MapView,
  buildInspectorStyle,
} from "@macrostrat/map-interface";
import { buildMacrostratStyle } from "@macrostrat/map-styles";
import { mergeStyles } from "@macrostrat/mapbox-utils";
import { useDarkMode, DarkModeButton } from "@macrostrat/ui-components";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState, useMemo } from "react";
import { createCheckins, useRockdAPI, Image, pageCarousel } from "../index";
import "@macrostrat/style-system";
import { MapPosition } from "@macrostrat/mapbox-utils";
import { configDefinitionsBuiltInGlobal } from "vike/dist/esm/node/plugin/plugins/importUserCode/v1-design/getVikeConfig/configDefinitionsBuiltIn";

export function Page() {
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
              h(MapView, { style: "mapbox://styles/mapbox/light-v10", mapboxToken: SETTINGS.mapboxAccessToken, }, ),
          ),
        ]
      );
}