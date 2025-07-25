import { useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Icon } from "@blueprintjs/core";
import h from "./main.module.sass";
import { SETTINGS } from "@macrostrat-web/settings";
import "@macrostrat/style-system";
import { MapAreaContainer, MapView } from "@macrostrat/map-interface";
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPosition } from "@macrostrat/mapbox-utils";
import { PanelCard } from "@macrostrat/map-interface";
import mapboxgl from 'mapbox-gl';


export function MapContainer({center, setOverlayOpen}) {
    const [style, setStyle] = useState("mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i");
    const [styleText, setStyleText] = useState("Show Satelite");
    const [map, setMap] = useState(null);

    useEffect(() => {
        if (map) {
            new mapboxgl.Marker().setLngLat(center).addTo(map);
        }
    }, [style, map]);

    const newMapPosition: MapPosition = {
        camera: {
          lat: center.lat, 
          lng: center.lng, 
          altitude: 300000, 
        },
      };

    const sateliteStyle = 'mapbox://styles/mapbox/satellite-v9';
    const whiteStyle = "mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i";
    const whiteText = "Show White";
    const sateliteText = "Show Satelite";

    return h("div.overlay-container", [
        h(MapAreaContainer, { style: {height: "93vh", top: "7vh"} },
            [
              h(MapView, { style: style, mapboxToken: SETTINGS.mapboxAccessToken, mapPosition: newMapPosition, onMapLoaded: (map) => {
                console.log("Map loaded", map);
                setMap(map);
              }})
            ]
          ),
        h('div', {className: 'banner'}, [
            h(Icon, {className: "banner-arrow", icon: "arrow-left", iconSize: "3vh", style: {color: 'white'}, onClick: () => {
                setOverlayOpen(false);
              }}),
            h(PanelCard, {className: "banner-button", onClick: () => {
                setStyle(style == whiteStyle ? sateliteStyle : whiteStyle);
                setStyleText(styleText == whiteText ? sateliteText : whiteText);
            }}, styleText),
        ]),
    ])
}