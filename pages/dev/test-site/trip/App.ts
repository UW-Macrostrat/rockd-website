import { isDetailPanelRouteInternal } from "#/map/map-interface/app-state";
import h from "@macrostrat/hyper";
import { parse } from "path";
import React, { useEffect, useState, useRef } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, Image } from "../index";
import { data } from "#/integrations/criticalmaas/ta1-results/@cog_id/@system/@system_version/+data";
import { map } from "underscore";

function getTrip() {
    const pageContext = usePageContext();
    console.log(pageContext.urlParsed);
    let trip = 'urlParsed' in pageContext && pageContext.urlParsed.search.trip;
    console.log(trip);
    return parseInt(trip);
}

export function App() {
    const pageContext = usePageContext();
    const [userData, setUserData] = useState(null);
    const [tripNum, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mapContainerRef = useRef(null);

    let trip;

    useEffect(() => {
        if (pageContext.urlParsed) {
            trip = parseInt(pageContext.urlParsed.search.trip);
            setTrip(trip);
        } else {
            setTrip(0);
        }
        console.log(`Fetching data for trip ID: ` + trip);

        // Ensure trip ID is valid
        if (isNaN(trip)) {
            setLoading(false);
            setError('Invalid trip ID.');
            return;
        }

        fetch(`https://rockd.org/api/v2/trips/${trip}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Fetched data:', data); // Log fetched data for debugging
                if (data.success && data.success.data.length > 0) {
                    setUserData(data.success.data[0]);
                } else {
                    setUserData(null);
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                setError(error.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []); 

    if (loading) {
        if(tripNum == null) {
            return h("div", { className: 'loading' }, [
                h("h1", "Loading trip..."),
            ]);
        } else {
            return h("div", { className: 'loading' }, [
                h("h1", "Loading trip " + tripNum + "..."),
            ]);
        }

    }

    if (error) {
        return h("div", { className: 'error' }, [
            h("h1", "Error"),
            h("p", error)
        ]);
    }

    if (!userData) {
        return h("div", { className: 'error' }, [
            h("h1", "Trip " + tripNum + " not found"),  
        ]);
    }

    

    // Data found correctly
    let data = userData;

    if (mapContainerRef.current) {
        console.log('Initializing map');
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

        // intialize map
        let map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i',
            center: [ 0, 0 ],
            zoom: 12,
        });

        // zoom bar
        let nav = new mapboxgl.NavigationControl({ showCompass: false })
        map.addControl(nav, 'top-left')
        
        // add markers
        let lats = [];
        let lngs = [];
        let markers = [];

        let el = h('div', {className: 'map_marker'});

        for(const stop of data.stops) {
            const marker = new mapboxgl.Marker(el)
                .setLngLat([stop.checkin.lng, stop.checkin.lat])
                .addTo(map);

            lats.push(stop.checkin.lat);
            lngs.push(stop.checkin.lng);
            markers.push({
                "lat": stop.checkin.lat,
                "long": stop.checkin.lng
            });
        }

        // set center locaiton
        map.fitBounds([
            [ Math.max(...lngs), Math.max(...lats) ],
            [ Math.min(...lngs), Math.min(...lats) ]
          ], {
            maxZoom: 12,
            duration: 0,
            padding: 75
          });

        map.on('click', (event) => {
            markers.forEach(marker => {
                // did we click on a marker?
                if(Math.abs(marker.lat - event.lngLat.lat) < .005 && Math.abs(marker.long - event.lngLat.lng) < .005 ) {
                    map.flyTo({
                        center: [marker.long, marker.lat],
                        zoom: 12,
                        speed: 1,
                        curve: 1,
                        easing(t) {
                            return t;
                        }
                    });
                }
            });
        });
    }

    // format date
    let date = new Date(data.updated);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    data.updated = date.toLocaleDateString('en-US', options);

    // profile pic
    let profile_pic = h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + data.person_id, className: "profile-pic"});

    // create stops
    let stops = [];
    let temp;
    for(var i = 0; i < data.stops.length; i++) {
        data.stops[i].name = (i + 1) + ". " + data.stops[i].name;
        temp = h('div', {className: 'stop-description'}, [
            h('h2', {className: 'stop-title'}, data.stops[i].name),
            h('p', {className: 'stop-text'}, data.stops[i].description),
            h('div', {className: 'stop-box'},[
                h('div', {className: 'box-header'},[
                    h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + data.person_id, className: "profile-pic-checkin"}),
                    h('div', {className: 'checkin-details'}, [
                        h('h4', {className: 'rock'}, data.stops[i].checkin.observations[0].rocks.strat_name.strat_name_long),
                        h('h4', {className: 'location'}, data.stops[i].checkin.near),
                        h('h4', {className: 'name'}, data.stops[i].checkin.first_name + " " + data.stops[i].checkin.last_name),
                    ]),
                    h(Image, {src: "marker.png", className: "marker"}),
                ]),
                h(BlankImage, {src: "https://rockd.org/api/v2/protected/image/"+ data.person_id + "/banner/" + data.stops[i].checkin.photo, className: "checkin-card-img"}),
            ]),
        ])
        stops.push(temp);
    }

    return h("div", {className: 'map'}, [
            h("div", { ref: mapContainerRef, className: 'map-container', style: { width: '100%', height: '75vh' } }),
            h('div', { className: 'stop-container', style: { width: '100%' } }, [
                h('div', { className: 'stop-header' }, [
                    h('h3', {className: 'profile-pic'}, profile_pic),
                    h('div', {className: 'stop-main-info'}, [
                        h('h3', {className: 'name'}, data.first_name + " " + data.last_name),
                        h('h3', {className: 'edited'}, "Edited " + data.updated),
                    ]),
                ]),
                h('h1', {className: 'park'}, data.name),
                h('div', {className: 'stop-list'}, stops),
            ])
        ]);
}
