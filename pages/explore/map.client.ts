import {
  MapAreaContainer,
  MapMarker,
  MapView,
} from "@macrostrat/map-interface";
import h from "./main.module.sass";
import "@macrostrat/style-system";
import { mapboxAccessToken } from "@macrostrat-web/settings";
import mapboxgl from "mapbox-gl";
import { useEffect } from "react";
import { useMapRef } from "@macrostrat/mapbox-react";

export function WeaverMapContainer({style, mapPosition, onSelectPosition, setSelectedCheckin, overlay}) {
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
              h(MapView, { style, mapboxToken: mapboxAccessToken, mapPosition }, [
                h(MapMarker, {
                  setPosition: onSelectPosition,
                }),
              ]),
    
              // The Overlay Div
              overlay,
              h(ClickedCheckins, {setSelectedCheckin}),
            ]
          ),
        ]
      );
}


function ClickedCheckins({setSelectedCheckin}) {
  const mapRef = useMapRef();
  const map = mapRef.current;

  useEffect(() => {
    if (!map) return;

    const handleClick = (e) => {
      const cluster = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });

      if(cluster.length > 0) {
        const zoom = cluster[0].properties.expansion_zoom;
        console.log("cluster", cluster[0]);

        console.log("zoom", zoom);

        map.flyTo({
          center: cluster[0].geometry.coordinates,
          zoom: zoom + 2,
          speed: 0.5,
        });
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: ['unclustered-point']
      });

      if (features.length > 0) {
        const checkinId = features[0].properties.id;

        // add marker
        const coord = features[0].geometry.coordinates.slice();
        console.log("coordinates", coord);

        const el = document.createElement('div');
        el.className = 'selected_pin';

        new mapboxgl.Marker(el)
          .setLngLat(coord)
          .addTo(map);

        console.log("data", features[0]);
        setSelectedCheckin(checkinId);
      } else {
        setSelectedCheckin(null); 
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map]);

  return null;
}