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
  PanelCard,
  buildInspectorStyle,
} from "@macrostrat/map-interface";
import { useMapRef } from "@macrostrat/mapbox-react";
import { buildMacrostratStyle } from "@macrostrat/mapbox-styles";
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
          "circle-opacity": 0.8,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": color,
        },
      },
    ],
  };
}

function FeatureDetails() {
  const mapRef = useMapRef();
  let checkins = [];
  const bounds = mapRef.current?.getBounds();

  // abitrary bounds around click point
  let minLat = Math.floor(bounds.getSouth() * 100) / 100;
  let maxLat = Math.floor(bounds.getNorth() * 100) / 100;
  let minLng = Math.floor(bounds.getEast() * 100) / 100;
  let maxLng = Math.floor(bounds.getWest() * 100) / 100;

  // change use map coords
  let result = useAPIResult("https://rockd.org/api/v2/protected/checkins?minlat=" + minLat + 
    "&maxlat=" + maxLat +
    "&minlng=" + minLng +
    "&maxlng=" + maxLng);

  if (result == null) return h(Spinner);
  result = result.success.data;

  let count = 0;
  result.forEach((checkin) => {
    count++;
    let temp = h('a', {className: 'stop-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id}, [
        h('div', {className: 'checkin'}, [
          h('h2', {className: 'checkin-title'}, (count + ". " + checkin.near)),
          h('p', {className: 'checkin-text'}, checkin.notes),
          h('div', {className: 'checkin-box'},[
              h('div', {className: 'box-header'},[
                  h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + checkin.person_id, className: "profile-pic"}),
                  h('h4', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
              ]),
              /*
              h('a', {className: 'stop-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id}, [
                  h(BlankImage, {src: "https://rockd.org/api/v2/protected/image/"+ checkin.person_id + "/banner/" + checkin.photo, className: "checkin-card-img"}),
              ]),
              */
          ]),
        ])
      ]);
      
    checkins.push(temp);
  });
  

  return h("div", {className: 'checkin-container'}, [
      h("h3", "Top Checkins"),
      h('div', checkins)
    ]);
}

function WeaverMap({
  title = "Explore",
  headerElement = null,
  mapboxToken,
}: {
  headerElement?: React.ReactElement;
  title?: string;
  children?: React.ReactNode;
  mapboxToken?: string;
}) {
  /* We apply a custom style to the panel container when we are interacting
    with the search bar, so that we can block map interactions until search
    bar focus is lost.
    We also apply a custom style when the infodrawer is open so we can hide
    the search bar on mobile platforms
  */

  const [isOpen, setOpen] = useState(false);

  const [type, setType] = useState(types[0]);

  const style = useMapStyle(type, mapboxToken);

  const [inspectPosition, setInspectPosition] =
    useState<mapboxgl.LngLat | null>(null);

  const onSelectPosition = useCallback((position: mapboxgl.LngLat) => {
    setInspectPosition(position);
  }, []);

  let detailElement = null;
  if (inspectPosition != null) {
    detailElement = h(
      LocationPanel,
      {
        onClose() {
          setInspectPosition(null);
        },
        position: inspectPosition,
      },

      h(FeatureDetails)
    );
  }

  return h(
    MapAreaContainer,
    {
      navbar: h(FloatingNavbar, [
        headerElement ?? h("h2", title),
        h(Spacer),
        h(MapLoadingButton, {
          active: isOpen,
          onClick: () => setOpen(!isOpen),
        }),
      ]),
      contextPanel: h(PanelCard, [
        h(DarkModeButton, { showText: true, minimal: true }),
        h(
          Select2,
          {
            items: types,
            itemRenderer: (data, { handleClick, modifiers }) =>
              h(MenuItem, {
                roleStructure: "listoption",
                active: modifiers.active,
                disabled: modifiers.disabled,
                text: data.name,
                //style: { color: d.color },
                key: data.id,
                onClick() {
                  handleClick();
                },
              }),
            itemPredicate: (query, item) =>
              item.name.toLowerCase().includes(query.toLowerCase()),
            onItemSelect: (item) => setType(item),
          },
        ),
      ]),
      detailPanel: detailElement,
      contextPanelOpen: isOpen,
    },
    h(MapView, { style, mapboxToken }, [
      h(MapMarker, {
        position: inspectPosition,
        setPosition: onSelectPosition,
      }),
    ])
  );
}


function useMapStyle(type, mapboxToken) {
  const dark = useDarkMode();
  const isEnabled = dark?.isEnabled;

  const baseStyle = isEnabled
    ? "mapbox://styles/mapbox/dark-v10"
    : "mapbox://styles/mapbox/light-v10";

  const [actualStyle, setActualStyle] = useState(baseStyle);

  // Auto select sample type
  const overlayStyle = mergeStyles(_macrostratStyle, weaverStyle(types[0]));
    buildInspectorStyle(baseStyle, overlayStyle, {
      mapboxToken,
      inDarkMode: isEnabled,
    }).then((s) => {
      setActualStyle(s);
    });

  useEffect(() => {
    const overlayStyle = mergeStyles(_macrostratStyle, weaverStyle(types[0]));
    buildInspectorStyle(baseStyle, overlayStyle, {
      mapboxToken,
      inDarkMode: isEnabled,
    }).then((s) => {
      setActualStyle(s);
    });
  }, [baseStyle, mapboxToken, isEnabled, type]);
  return actualStyle;
}
