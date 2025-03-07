import h from "@macrostrat/hyper";
import { useEffect, useState, useRef } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, createCheckins } from "../index";
import "../main.styl";
import "@macrostrat/style-system";
import { SETTINGS } from "@macrostrat-web/settings";
import { DarkModeButton } from "@macrostrat/ui-components";
import "./main.sass"

export function Page() {
    const pageContext = usePageContext();
    const [userData, setUserData] = useState(null);
    const [tripNum, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mapContainerRef = useRef(null);
    const [center, setCenter] = useState();
    const mapRef = useRef(null);

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

                    return data.success.data[0];
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

    useEffect(() => {
        // Check if the map instance already exists
        if (mapRef.current || !mapContainerRef.current) return;

        try {
            // Initialize Mapbox map
            mapboxgl.accessToken = SETTINGS.mapboxAccessToken;

            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i',
                center: [10, 10],
                zoom: 12,
            });

            // Add navigation controls
            mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

        } catch (error) {
            console.error("Error initializing the map:", error);
        }

        let lats = [];
        let lngs = [];
        const map = mapRef.current;
        userData.stops.forEach((stop, index) => {
            const count = index + 1;
            const el = document.createElement('div');
            el.className = 'pin';

            const number = document.createElement('span');
            number.innerText = count;

            // Append the number to the marker
            el.appendChild(number);

            // Create marker
            new mapboxgl.Marker(el)
                .setLngLat([stop.checkin.lng, stop.checkin.lat])
                .addTo(map);

            el.addEventListener('click', () => {
                map.flyTo({
                    center: [stop.checkin.lng, stop.checkin.lat],
                    zoom: 12,
                });
            });

            // add to array
            lats.push(stop.checkin.lat);
            lngs.push(stop.checkin.lng);
        });

        
         // set center locaiton
         mapRef.current.fitBounds([
            [ Math.max(...lngs), Math.max(...lats) ],
            [ Math.min(...lngs), Math.min(...lats) ]
        ], {
            maxZoom: 12,
            duration: 0,
            padding: 75
        });
    }, [userData]);

    // when outside marker is clicked
    useEffect(() => {
        if (mapRef.current && center) {
            mapRef.current.flyTo({
                center: [center.lng, center.lat],
                zoom: 12,
                speed: 1,
                curve: 1,
            });
        }
    }, [center]);

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
        return h("div", { className: 'error-main' }, [
            h("div", { className: 'error' }, [
                h("h1", "Error"),
                h("p", error)
            ]),
        ]);
    }

    if (!userData) {
        return h("div", { className: 'error' }, [
            h(BlankImage, {className: "error-img", src: "https://rockd.org/assets/img/404.jpg"}),
            h("h1", "Trip " + tripNum + " not found!"),  
        ]);
    }

    

    // Data found correctly
    let data = userData;

    // format date
    let date = new Date(data.updated);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    data.updated = date.toLocaleDateString('en-US', options);

    // profile pic
    let profile_pic = h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + data.person_id, className: "profile-pic"});

    // create stops

    let final = data.stops;
    let arr = [];
    final.forEach((stop) => { 
        let temp = stop.checkin;
        temp.name = stop.name; 
        arr.push(stop.checkin);
    });

    let stops = createCheckins(arr, mapRef, "marker_red.png", "likes");

    return h("div", {className: 'body'}, [
        h("div", {className: 'map'}, [
            h("div", { ref: mapContainerRef, className: 'map-container', style: { width: '100%', height: '100vh' } }),
            h('div', { className: 'stop-container', style: { width: '100%' } }, [
                h('div', { className: 'top' }, [
                    h('div', { className: 'checkin-header' }, [
                        h('h3', {className: 'profile-pic'}, profile_pic),
                        h('div', {className: 'checkin-info'}, [
                            h('h3', {className: 'name'}, data.first_name + " " + data.last_name),
                            h('h4', {className: 'edited'}, "Edited " + data.updated),
                        ]),
                        h(DarkModeButton, { className: 'dark-mode-button', showText: true }),
                    ]),
                    h('h1', {className: 'park'}, data.name),
                    h('p', {className: 'download-button'}, [
                        h('a', {className: 'kmz', href: "https://rockd.org/api/v2/trips/" + data.trip_id + "?format=kmz"}, "DOWNLOAD KMZ"),
                    ]),
                ]),
                h('div', { className: 'bottom' }, [
                    h('div', {className: 'stop-list'}, stops),
                ]),
            ]),
        ]),
    ]);
}