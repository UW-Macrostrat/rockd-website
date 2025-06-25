import h from "@macrostrat/hyper";
import { useAPIResult } from "@macrostrat/ui-components";
import {
  MapAreaContainer,
  MapView,
} from "@macrostrat/map-interface";
import { mapboxAccessToken } from "@macrostrat-web/settings";

export function Page() {
    return h('div.heatmap-page', [
        h(PageHeader),
        h(Map),
    ])
}

function PageHeader() {
    const visitsToday = getVisitsToday();
    console.log('visitsToday', visitsToday);

    const Visit = !visitsToday ? 
        h('p', 'Loading visits...') : 
        h('div.visits-today', [
            h('p', `Visits today: ${visitsToday.visits}`),
            h('p', `Unique visitors today: ${visitsToday.visitors}`),
        ])

    return h('div.page-header', [
        h('h1', 'Heatmap'),
        h('p', 'This is a heatmap of all the locations where Macrostrat has been accessed.'),
        h('p', 'The blue markers indicate today\'s accesses, while the grey markers indicate accesses from other days.'),
        Visit
    ]);
}

function Map() {   
    const coords = getAllCoords();

    const today = getTodayCoords();

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

            map.addSource('markers', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: allFeatures,
                },
            });

            // Individual points - others (grey)
            map.addLayer({
                id: 'markers-other',
                type: 'circle',
                source: 'markers',
                filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isToday'], false]],
                paint: {
                    'circle-radius': 2,
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
                    'circle-radius': 3,
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

function getAllCoords() {
    return useAPIResult('/api/matomo', {
        date: '2025-01-01,2025-06-24',
        period: 'range',
        filter_limit: 10000,
        filter_offset: 0,
        showColumns: 'latitude,longitude',
        doNotFetchActions: true,
    })
}

function getTodayCoords() {
    return useAPIResult('/api/matomo', {
        date: 'today',
        period: 'day',
        filter_limit: 10000,
        filter_offset: 0,
        showColumns: 'latitude,longitude',
        doNotFetchActions: true,
    })
}

function getVisitsToday() {
    return useAPIResult('/api/matomo', {
        method: "Live.getCounters",
        idSite: 1,
        lastMinutes: 1440
    })?.[0]
}