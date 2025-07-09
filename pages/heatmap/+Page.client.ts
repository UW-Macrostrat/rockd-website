import h from "./main.module.sass";
import { useAPIResult } from "@macrostrat/ui-components";
import {
  MapAreaContainer,
  MapView,
} from "@macrostrat/map-interface";
import { mapboxAccessToken } from "@macrostrat-web/settings";
import { Footer } from "~/components/general";
import { Divider, Spinner } from "@blueprintjs/core";

export function Page() {
    const coords = getAllCoords();

    return h('div.main', [
        h('div.heatmap-page', [
            h(PageHeader, { coords }),
            h(Map, { coords })
        ]),
        h(Footer)
    ]) 
}

function PageHeader({ coords }) {
    const visitsToday = getVisitsToday();

    const { visits, visitors } = visitsToday || {};

    const Visit = !visitsToday ? 
        h('p', 'Loading visits...') : 
        h('div.visits-today', [
            h('h3', `${visits.toLocaleString()} visits today`),
            h.if(coords?.length)('h3', `${coords?.length.toLocaleString()} visits this year`),
        ])

    return h('div.page-header', [
        h('h1', 'Heatmap'),
        Visit,
        h(Divider),
        h('p', 'This is a heatmap of all the locations where Macrostrat has been accessed.'),
        h('p', 'The blue markers indicate today\'s accesses, while the grey markers indicate accesses from other days.'),
    ]);
}

function Map({coords}) {   
    const today = getTodayCoords();

    const style = 'mapbox://styles/mapbox/dark-v10';

    if (!coords || !today) {
      return h("div.map-area-container.loading", [
        h(Spinner, { size: 50 }),
      ]);
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
                className: "map-area-container",
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
        date: '2025-01-01,today',
        period: 'range',
        filter_limit: 10000,
        filter_offset: 0,
        showColumns: 'latitude,longitude',
        doNotFetchActions: true,
    })
}

function getTodayCoords(): Array<{ latitude: number, longitude: number }> | undefined {
    return useAPIResult('/api/matomo', {
        date: 'today',
        period: 'day',
        filter_limit: 10000,
        filter_offset: 0,
        showColumns: 'latitude,longitude',
        doNotFetchActions: true,
    })
}

function getVisitsToday(): { visits: number, visitors: number } | undefined {
    return useAPIResult('/api/matomo', {
        method: "Live.getCounters",
        idSite: 1,
        lastMinutes: 1440
    })?.[0]
}