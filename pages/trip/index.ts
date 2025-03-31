import h from "@macrostrat/hyper";
import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, createCheckins, apiURL, useRockdAPI, Image } from "../index";
import "../main.sass";
import "@macrostrat/style-system";
import { SETTINGS } from "@macrostrat-web/settings";
import { DarkModeButton } from "@macrostrat/ui-components";
import "./main.sass";
import { PanelCard } from "@macrostrat/map-interface";
import { Divider, Icon } from "@blueprintjs/core";

export function Trips({trip}) {
    const mapContainerRef = useRef(null);
    const center = null;
    const mapRef = useRef(null);
    const [showSatelite, setSatelite] = useState(false);

    const userData = useRockdAPI("trips/" + trip);

    const style = useMapStyle({showSatelite});
    console.log("Map style:", style);

    useEffect(() => {
        // Check if the map instance already exists
        if (!mapContainerRef.current) return;

        try {
            // Initialize Mapbox map
            mapboxgl.accessToken = SETTINGS.mapboxAccessToken;

            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: style,
                center: [10, 10],
                zoom: 12,
            });

            // Add navigation controls
            mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        } catch (error) {
            console.error("Error initializing the map:", error);
        }

        let lats = [];
        let lngs = [];
        const map = mapRef.current;

        userData.success.data[0].stops.forEach((stop, index) => {
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
    }, [userData, style]);

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

    if (!userData) {
        return h("div", { className: 'loading' }, [
            h("h1", "Loading trip..."),
        ]);
    }

    if (userData.success.data.length == 0) {
        return h("div", { className: 'error' }, [
            h(BlankImage, {className: "error-img", src: "https://rockd.org/assets/img/404.jpg"}),
            h("h1", "Trip " + trip + " not found!"),  
        ]);
    }

    

    // format date
    const data = userData.success.data[0];
    let date = new Date(data.updated);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    data.updated = date.toLocaleDateString('en-US', options);

    // profile pic
    let profile_pic = h(BlankImage, {src: apiURL + "protected/gravatar/" + data.person_id, className: "profile-pic"});

    // create stops

    const final = data.stops;
    let arr = [];
    final.forEach((stop) => { 
        let temp = stop.checkin;
        temp.name = stop.name; 
        arr.push(stop.checkin);
    });

    const stops = createCheckins(arr, mapRef, null);

    const toolbar = h(Toolbar, {showSatelite, setSatelite});

    return h("div", {className: 'body'}, [
        h("div", {className: 'map'}, [
            h("div", { ref: mapContainerRef, className: 'map-container', style: { width: '100%', height: '100vh' } }),
            toolbar,
            h('div', { className: 'stop-container', style: { width: '100%' } }, [
                h('div', { className: 'top' }, [
                    h('div', { className: 'checkin-header' }, [
                        h('h3', {className: 'profile-pic'}, profile_pic),
                        h('div', {className: 'stop-info'}, [
                            h('h3', {className: 'name'}, data.first_name + " " + data.last_name),
                            h('h4', {className: 'edited'}, "Edited " + data.updated),
                        ]),
                    ]),
                ]),
                h('div', { className: 'bottom' }, [
                    h("div.details", [
                        h('h1', {className: 'park'}, data.name),
                        h('p', {className: 'description'}, data.description),
                        h('p', {className: 'download-button'}, [
                            h('a', {className: 'kmz', href: apiURL + "/trips/" + data.trip_id + "?format=kmz"}, "DOWNLOAD KMZ"),
                        ]),
                    ]),
                    h('div', {className: 'stop-list'}, stops),
                ]),
            ]),
        ]),
    ]);
}

function Toolbar({showSatelite, setSatelite}) {
    const [showSettings, setSettings] = useState(false);

    return h(PanelCard, { className: "toolbar" }, [
        h("div.toolbar-header", [
          h("a", { href: "/" }, 
            h(Image, { className: "home-icon", src: "favicon-32x32.png" }),
          ),
          h(Icon, { className: "settings-icon", icon: "settings", onClick: () => {
            setSettings(!showSettings);
          }
          }),
        ]),
        h("div", { className: showSettings ? "settings-content" : "hide" }, [
            h(Divider, { className: "divider" }),
            h("div", { className: "settings" }, [
                h(DarkModeButton, { className: "dark-btn", showText: true } ),
                h(PanelCard, {className: "map-style", onClick: () => {
                        setSatelite(!showSatelite);
                    }}, [
                        h(Icon, { className: "satellite-icon", icon: "satellite"}),
                        h("p", "Satellite"),
                    ]),
                ]),
            ])
      ]);
}

function useMapStyle({showSatelite}) {
    const white = "mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i";
    const satellite = 'mapbox://styles/mapbox/satellite-v9';

    return showSatelite ? satellite : white;
}