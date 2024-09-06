import h from "@macrostrat/hyper";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export function Map() {
    const mapContainerRef = useRef(null);

    useEffect(() => {
        if (mapContainerRef.current) {
            mapboxgl.accessToken = "pk.eyJ1IjoiamN6YXBsZXdza2kiLCJhIjoiWnQxSC01USJ9.oleZzfREJUKAK1TMeCD0bg";

            new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [-74.5, 40],
                zoom: 9,
            });
        }
    }, []);

    return h("div", { ref: mapContainerRef, className: 'map-container', style: { width: '100%', height: '100vh' } });
}
