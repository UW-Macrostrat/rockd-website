import hyper from "@macrostrat/hyper";
import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, createCheckins, apiURL, useRockdAPI, Image } from "../index";
import styles from "../main.module.sass";
import "@macrostrat/style-system";
import { SETTINGS } from "@macrostrat-web/settings";
import { DarkModeButton } from "@macrostrat/ui-components";
import "./main.sass";
import { Divider, Icon, Spinner } from "@blueprintjs/core";
import {
  MapAreaContainer,
  MapMarker,
  MapView,
  PanelCard,
} from "@macrostrat/map-interface";
import { useMapRef } from "@macrostrat/mapbox-react";

const h = hyper.styled(styles);

export function Trips({trip}) {
    const center = null;
    const mapRef = useRef(null);
    const [showSatelite, setSatelite] = useState(false);

    const userData = useRockdAPI("trips/" + trip);

    const style = useMapStyle({showSatelite});
    
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

    const toolbar = h(Toolbar, {showSatelite, setSatelite});
    const sidebar = h(SideBar, {data});

    let start = [data.stops[0].checkin.lng, data.stops[0].checkin.lat];
    const newMapPosition ={
            camera: {
              lat: start[1],
              lng: start[0],
              altitude: 300000,
            },
          };
    

    return h("div", {className: 'body'}, [
        h("div", {className: 'map'}, [
            h(
                "div.map-container",
                [
                  // The Map Area Container
                  h(
                    MapAreaContainer,
                    {
                      className: "map-area-container",
                      style: { width: "70%", right: "30%", height: "100vh" },
                    },
                    [
                        h(MapView, { style: style, mapboxToken: SETTINGS.mapboxAccessToken, mapPosition: newMapPosition }, [
                        ]),
                        sidebar,
                    ]
                  ),
                ]
              ),
            toolbar,
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

function SideBar({data}) {
    const mapRef = useMapRef();
    const map = mapRef.current;
    const profile_pic = h(BlankImage, {src: apiURL + "protected/gravatar/" + data.person_id, className: "profile-pic"});
    const stops = data.stops;

    if(!map) return h("div.stop-container", h(Spinner, {style: {"margin-top": "10vh"}}));


    let arr = [];
    let lats = [];
    let lngs = [];
    stops.forEach((stop, index) => { 
        let temp = stop.checkin;
        temp.name = stop.name; 
        arr.push(stop.checkin);

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

    const bounds = [
        [ Math.max(...lngs), Math.max(...lats) ],
        [ Math.min(...lngs), Math.min(...lats) ]
    ];

    map.fitBounds(bounds);    

    const stopCheckins = createCheckins(arr, mapRef, null);

    return h('div', { className: 'stop-container'}, [
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
            h('div', {className: 'stop-list'}, stopCheckins),
        ]),
    ]);
}