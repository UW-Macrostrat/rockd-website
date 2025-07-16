import h from "./main.module.sass";
import { useAPIResult } from "@macrostrat/ui-components";
import {
  MapAreaContainer,
  MapView,
} from "@macrostrat/map-interface";
import { mapboxAccessToken, matomoToken, matomoApiURL } from "@macrostrat-web/settings";
import { Footer } from "~/components/general";
import { Divider, Spinner, Tabs, Tab } from "@blueprintjs/core";
import { useEffect, useState } from "react";


export function Page() {
    const [data, setData] = useState<Array<{ lat: number; lng: number }> | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const result = await fetchAllUsageStats();
            setData(result);
        };

        fetchData();
    }, []);

    return h('div.main', [
        h('div.heatmap-page', [
            h(PageHeader, { coords: data }),
            h(
                Tabs,
                {
                    id: 'heatmap-tabs',
                },
                [
                    h(Tab, { id: 'today', title: 'Today', panelClassName: 'today-tab-panel', panel: h(TodayMap, { data }) }),
                ]
            )
        ]),
        h(Footer)
    ]);
}

function PageHeader({ coords }) {
    return h('div.page-header', [
        h('h1', 'Heatmap'),
        h.if(coords?.length)('h3', `${coords?.length?.toLocaleString()} visits this year`),
        h(Divider),
        h('p', 'This is a heatmap of all the locations where Macrostrat has been accessed.'),
        h('p', 'The blue markers indicate today\'s accesses, while the grey markers indicate accesses from other days.'),
    ]);
}

function AllMap({coords, today}) {   
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

    return h(MapInner, { handleMapLoaded });
}

function MapInner({handleMapLoaded}) {
    const style = 'mapbox://styles/mapbox/dark-v10';

    return h(
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
        ]
    );
}

function TodayMap({data}) {   
    if (!data) {
      return h("div.map-area-container.loading", [
        h(Spinner, { size: 50 }),
      ]);
    }

    const handleMapLoaded = (map) => {
        map.on('load', () => {
            // Combine coords and today coords, marking today's points
            const allFeatures = data.map((coord) => ({
                type: 'Feature',
                geometry: {
                type: 'Point',
                coordinates: [coord.lng, coord.lat],
                },
            }))

            map.addSource('markers', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: allFeatures,
                },
            });

            map.addLayer({
                id: 'markers-today',
                type: 'circle',
                source: 'markers',
                paint: {
                    'circle-radius': 3,
                    'circle-color': '#007cbf',
                },
            });
        });
    };

    return h(MapInner, { handleMapLoaded });
}

async function getAllCoords(): Promise<Array<{ latitude: number, longitude: number }>> {
    const allCoords: Array<{ latitude: number, longitude: number }> = [];
    const pageSize = 10000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const result = await fetch(`${matomoApiURL}?${new URLSearchParams({
            date: '2025-07-01,today',
            period: 'range',
            filter_limit: pageSize.toString(),
            filter_offset: offset.toString(),
            showColumns: 'latitude,longitude',
            doNotFetchActions: 'true',
            module: 'API',
            idSite: '1',
            format: 'json',
            token_auth: matomoToken,
            method: 'Live.getLastVisitsDetails',
        })}`).then(res => res.json());

        if (Array.isArray(result) && result.length > 0) {
            allCoords.push(...result);
            offset += pageSize;
            if (result.length < pageSize) {
                hasMore = false;
            }
        } else {
            hasMore = false; 
        }
    }

    return allCoords;
}


function getTodayCoords(): Array<{ latitude: number, longitude: number }> | undefined {
    return useAPIResult(matomoApiURL, {
        date: 'today',
        period: 'day',
        filter_limit: 10000,
        filter_offset: 0,
        module: 'API',
        format: 'json',
        showColumns: 'latitude,longitude',
        doNotFetchActions: true,
        idSite: '1',
        method: 'Live.getLastVisitsDetails',
        token_auth: matomoToken
    })
}

function getVisitsToday(): { visits: number, visitors: number } | undefined {
    return useAPIResult(matomoApiURL, {
        method: "Live.getCounters",
        lastMinutes: 1440,
        module: 'API',
        format: 'json',
        idSite: '1',
        token_auth: matomoToken
    })?.[0]
}

async function fetchAllUsageStats() {
  let allData = [];
  let lastId = 0;
  const limit = 10000;
  let keepFetching = true;

  while (keepFetching) {
    const url = `http://localhost:5500/usage-stats?id=${lastId}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const json = await response.json();
    const batch = json.data || [];

    allData = allData.concat(batch);

    if (batch.length < limit) {
      // Less than limit means no more data
      keepFetching = false;
    } else {
      // Update lastId to the max id from this batch
      lastId = batch.reduce((max, item) => (item.id > max ? item.id : max), lastId);
    }
  }

  return allData;
}