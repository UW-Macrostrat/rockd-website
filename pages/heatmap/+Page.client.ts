import h from "@macrostrat/hyper";
import { useAPIResult } from "@macrostrat/ui-components";
import {
  MapAreaContainer,
  MapMarker,
  MapView,
} from "@macrostrat/map-interface";
import { mapboxAccessToken } from "@macrostrat-web/settings";
import mapboxgl from "mapbox-gl";

export function Page() {   
    const coords = useAPIResult('/api/matomo', {
        date: '2025-01-01,2025-06-24',
        period: 'range',
        filter_limit: 10000,
        filter_offset: 0,
        showColumns: 'latitude,longitude',
        doNotFetchActions: true,
    })

    const style = 'mapbox://styles/mapbox/streets-v11';

    console.log("Matomo API response:", coords);

    if (!coords || coords?.length === 0) {
      return h("div", "Loading data...");
    }

    const handleMapLoaded = (map) => {
        map.on('load', () => {
            map.addSource('markers', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: coords.map(coord => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [coord.longitude, coord.latitude],
                },
                properties: {},
                })),
            },
            });

            map.addLayer({
            id: 'markers',
            type: 'circle',
            source: 'markers',
            paint: {
                'circle-radius': 6,
                'circle-color': '#007cbf',
            },
            });

            const lngs = coords.map(c => c.longitude);
            const lats = coords.map(c => c.latitude);

            const bounds = [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
            ];

            map.fitBounds(bounds, {
            padding: { top: 20, bottom: 20, left: 200, right: 20 },
            animate: false,
            });
        });
        };


    return h(
            "div.map-container",
            [
              h(
                MapAreaContainer,
                {

                },
                [
                  h(MapView, { 
                    style, 
                    mapboxToken: mapboxAccessToken, 
                    onMapLoaded: handleMapLoaded
                }),
                ]
              ),
            ]
          );
}