import h from "@macrostrat/hyper";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Image } from "../index";

export function Map() {
    const mapContainerRef = useRef(null);

    useEffect(() => {
        if (mapContainerRef.current) {
            // update getting access key
            mapboxgl.accessToken = "XXXX";

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
                    h('h3', {className: 'profile-pic'}, h("Image", {src:"sample.jpg"})),
                    h('div', {className: 'stop-main-info'}, [
                        h('h3', {className: 'name'}, "Stop Name"),
                        h('h3', {className: 'edited'}, "Edited: 1/1/2021"),
                    ]),
                ]),
                h('h1', {className: 'park'}, "Park Name"),
                h('div', {className: 'stop-description'}, [
                    h('h2', {className: 'stop-title'}, "Stop Title"),
                    h('p', {className: 'stop-text'}, "Stop Description"),
                ]),
            ])
        ]);
}
