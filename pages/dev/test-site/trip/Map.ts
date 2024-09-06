import h from "@macrostrat/hyper";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export function Map() {
    const mapContainerRef = useRef(null);

    useEffect(() => {
        if (mapContainerRef.current) {
            // update getting access key
            mapboxgl.accessToken = "fill-in";

            new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i',
                center: [-89.4,43.072 ], // long, lat
                zoom: 12,
            });
        }
    }, []);

    return h("div", {className: 'map'}, [
            h("div", { ref: mapContainerRef, className: 'map-container', style: { width: '100%', height: '80vh' } }),
            h('div', { className: 'stop-container', style: { width: '100%', height: '80vh' } }, [
                h('div', { className: 'stop-header' }, [
                    h('h3', {className: 'name'}, "Person Name"),
                    h('h1', {className: 'park'}, "Park Name"),
                ])
            ])
        ]);
}
