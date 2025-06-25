import h from "@macrostrat/hyper";
import { useAPIResult } from "@macrostrat/ui-components";
import {
  MapAreaContainer,
  MapMarker,
  MapView,
} from "@macrostrat/map-interface";
import { mapboxAccessToken } from "@macrostrat-web/settings";

export function Page() {   
    const coords = useAPIResult('/api/matomo', {
        date: '2025-01-01,2025-06-24',
        period: 'range',
        filter_limit: 10000,
        filter_offset: 0,
        showColumns: 'latitude,longitude',
        doNotFetchActions: true,
    })

    const today = useAPIResult('/api/matomo', {
        date: 'today',
        period: 'day',
        filter_limit: 10000,
        filter_offset: 0,
        showColumns: 'latitude,longitude',
        doNotFetchActions: true,
    })

    const style = 'mapbox://styles/mapbox/streets-v11';

    if (!coords || !today) {
      return h("div", "Loading data...");
    }

    const handleMapLoaded = (map) => {
        map.on('load', () => {
            // Combine coords and today coords, marking today's points
            const allFeatures = coords.map((coord) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [coord.longitude, coord.latitude],
                },
                properties: {
                    isToday: false,
                },
            })).concat(
                today.map((coord) => ({
                    type: 'Feature',
                    geometry: {
                    type: 'Point',
                    coordinates: [coord.longitude, coord.latitude],
                    },
                    properties: {
                    isToday: true,
                    },
                }))
            );

            // Add clustered source
            map.addSource('markers', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: allFeatures,
                },
                cluster: true,
                clusterMaxZoom: 14, // Max zoom to cluster points on
                clusterRadius: 50,  // Radius of each cluster in pixels
            });

            // Cluster circles
            map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'markers',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': '#888',
                    'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    15,
                    10, 20,
                    50, 25,
                    100, 30
                    ],
                },
            });

            // Cluster count labels
            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'markers',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                },
            });

            // Individual points - others (grey)
            map.addLayer({
                id: 'markers-other',
                type: 'circle',
                source: 'markers',
                filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isToday'], false]],
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#888',
                },
            });

            // Individual points - today (blue)
            map.addLayer({
                id: 'markers-today',
                type: 'circle',
                source: 'markers',
                filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isToday'], true]],
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#007cbf',
                },
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
                    onMapLoaded: handleMapLoaded,
                    mapPosition:  {
                        camera: {
                            lat: 39, 
                            lng: -98, 
                            altitude: 6000000,
                        },
                    },
                }),
            ]),
        ]
    );
}