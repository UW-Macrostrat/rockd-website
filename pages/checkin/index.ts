import hyper from "@macrostrat/hyper";
import { LngLatCoords } from "@macrostrat/map-interface";
import { useEffect, useState, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, imageExists, Footer, apiURL, apiURLOld, useRockdAPI } from "../index";
import { Icon } from "@blueprintjs/core";
import styles from "../main.module.sass";
import { SETTINGS } from "@macrostrat-web/settings";
import { DarkModeButton } from "@macrostrat/ui-components";
import "./main.sass";
import "@macrostrat/style-system";
import { MapAreaContainer, MapView, MapMarker } from "@macrostrat/map-interface";
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPosition } from "@macrostrat/mapbox-utils";
import { PanelCard } from "@macrostrat/map-interface";

const h = hyper.styled(styles);

export function Checkins({checkinID}) {
    const checkinData = useRockdAPI("protected/checkins?checkin_id=" + checkinID);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [overlayImage, setOverlayImage] = useState(null);
    const [overlayBody, setOverlayBody] = useState(null);
    const [showMap, setShowMap] = useState(false);

    if (!checkinData) {
        return h("div", { className: 'loading' }, [
            h("h1", "Loading checkin..."),
        ]);       
    }

    if (checkinData.success.data.length == 0) {
        return h("div", { className: 'error' }, [
            h(BlankImage, {className: "error-img", src: "https://rockd.org/assets/img/404.jpg"}),
            h("h1", "Checkin " + checkinID + " not found!"),  
        ]); 
    }

    const checkin = checkinData.success.data[0];
    const center = {
        lat: checkin.lat,
        lng: checkin.lng
    }

    let profile_pic = h(BlankImage, {src: apiURL + "protected/gravatar/" + checkin.person_id, className: "profile-picture"});
    
    // format rating
    let ratingArr = [];
    for(var i = 0; i < checkin.rating; i++) {
        ratingArr.push(h(Icon, {className: "star", icon: "star", style: {color: 'white'}}));
    }
    for(var i = 0; i < 5 - checkin.rating; i++) {
        ratingArr.push(h(Icon, {className: "star", icon: "star-empty", style: {color: 'white'}}));
    }

    // get observations
    let observations = [];

    // add checkin photo and notes
    const imageSrc = apiURL + "protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo;
    const headerImgUrl = checkin.photo && imageExists(imageSrc) ? imageSrc : null;
    const headerBody = h('h4', {className: 'observation-header'}, checkin.notes);

    observations.push(
        h('div', {className: 'observation'}, [
            headerImgUrl ? h(BlankImage, { className: 'observation-image', src: headerImgUrl, onClick: () => {
                setOverlayBody(h('div.observation-body',headerBody));
                setOverlayImage(headerImgUrl);
                setOverlayOpen(!overlayOpen);
                }
            }) : null,
            h("div.observation-body", headerBody),
        ])
    );

    // add observations
    checkin.observations.forEach(observation => {
        console.log("obs", observation.photo, observation);
        if(Object.keys(observation.rocks).length != 0) {
            // if photo exists
            const imageSrc = apiURL + "protected/image/" + checkin.person_id + "/thumb_large/" + observation.photo;
            const observationURL = observation.photo && imageExists(imageSrc) ? imageSrc : null;
            let observationBody = observationFooter(observation);

            observations.push(
                h('div', {className: 'observation'}, [
                    observationURL ? h(BlankImage, { className: 'observation-image', src: observationURL, onClick: () => {
                        setOverlayImage(imageSrc);
                        setOverlayBody(observationBody);
                        setOverlayOpen(!overlayOpen);
                    }}) : null,
                    observationBody,
                ])
            );
        }        
    });

    let LngLatProps = {
        position: {
            lat: checkin.lat,
            lng: checkin.lng
        },
        precision: 3,
        zoom: 10
    };

    // overlay
    let overlay = h('div', {className: 'overlay'}, [
        h('div.overlay-header', [
            h(Icon, {className: "left-arrow back-arrow", icon: "arrow-left", iconSize: "5vh", style: {color: 'black'}, 
                onClick: () => {
                    setOverlayOpen(!overlayOpen);
                }
            }),
        ]),
        h('div.overlay-body', [
            h(BlankImage, { className: 'observation-image', src: overlayImage }),
            overlayBody,
        ])
    ]);

    const map = h(Map, {center, showMap, setShowMap});

    let main = h('div', { className: "container" }, [
        h('div', { className: showMap ? 'hide' : 'main'}, [
            h('div', { className: "checkin-head" }, [
                h('h1', checkin.notes),
                h(DarkModeButton, { className: 'dark-mode-button', showText: true }),
            ]),
            h(BlankImage, { className: "location-img", src: "https://api.mapbox.com/styles/v1/jczaplewski/cje04mr9l3mo82spihpralr4i/static/geojson(%7B%22type%22%3A%22Point%22%2C%22coordinates%22%3A%5B" + checkin.lng + "%2C" + checkin.lat + "%5D%7D)/" + checkin.lng + "," + checkin.lat + ",5,0/1200x400?access_token=" + SETTINGS.mapboxAccessToken }),
            h('div', { className: 'stop-header', onClick: () => { setShowMap(true); console.log("center", center) } }, [
                profile_pic,
                h('div', {className: 'stop-main-info'}, [
                    h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
                    h('h4', {className: 'edited'}, checkin.created),
                    h('p', {className: 'location'}, [
                        h('p', "Near " + checkin.near),
                    ]),
                    LngLatCoords(LngLatProps),
                    h('h3', {className: 'rating'}, ratingArr),
                ]),
            ]),
            h('div', { className: 'observations' }, observations),
        ]),
        h('div', { className: showMap ? 'hide' : 'bottom' }, [
            h(Footer),
        ]),
        h('div', { className: !showMap ? 'hide' : 'map'}, map)
    ])


    return overlayOpen ? overlay : main;
}

function observationFooter(observation) {
    const LngLatProps = {
        position: {
            lat: observation.lat,
            lng: observation.lng
        },
        precision: 3,
        zoom: 10
    };

    const rocks = observation.rocks;

    // get liths
    let liths = [];
    for(var j = 0; j < rocks.liths.length; j++) {                
        liths.push(h('p', { className: "observation-detail liths"}, rocks.liths[j].name));
    }

    // observation body
    let obsAge = observation.age_est ? observation.age_est.name + " (" + observation.age_est.b_age + " - " + observation?.age_est?.t_age + ")" : null;
    return h('div', {className: 'observation-body'}, [
        observation.lat && rocks.strat_name?.strat_name_long ? h('h4', {className: 'observation-header'}, [
            rocks.strat_name?.strat_name_long,
            observation.lat ? LngLatCoords(LngLatProps) : null,
        ]) : null,
        h('div', {className: 'observation-details'}, [
            rocks.strat_name?.strat_name_long ? h('p', {className: 'observation-detail'}, rocks.strat_name?.strat_name_long) : null,
            rocks.map_unit?.unit_name ? h('p', {className: 'observation-detail'}, rocks.map_unit?.unit_name) : null,
            obsAge ? h('p', {className: 'observation-detail'}, obsAge) : null,
            rocks.interval.name ? h('p', {className: 'observation-detail interval'}, rocks.interval.name) : null,
            liths,
            observation.orientation.feature?.name ? h('p', {className: 'observation-detail'}, observation.orientation.feature?.name) : null,
            h('p', {className: "notes"}, rocks.notes),
        ]),
    ]);
}

function Map({center, showMap, setShowMap}) {
    const [style, setStyle] = useState("mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i");
    const [styleText, setStyleText] = useState("Show Satelite");

    const newMapPosition: MapPosition = {
        camera: {
          lat: center.lat,  // Latitude
          lng: center.lng, // Longitude
          altitude: 300000, // Altitude (height from the Earth's surface)
        },
      };

    const sateliteStyle = 'mapbox://styles/mapbox/satellite-v9';
    const whiteStyle = "mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i";
    const whiteText = "Show White";
    const sateliteText = "Show Satelite";

    let map = h("div.map", [
        h(MapAreaContainer, { style: {height: "93vh", top: "7vh"} },
            [
              h(MapView, { style: style, mapboxToken: SETTINGS.mapboxAccessToken, mapPosition: newMapPosition }, [
                h(MapMarker, {
                    position: center,
                   }),
              ]),
            ]
          ),
        h('div', {className: 'banner'}, [
            h(Icon, {className: "left-arrow banner-arrow", icon: "arrow-left", iconSize: "4vh", style: {color: 'black'}, onClick: () => {
                setShowMap(!showMap);
              }}),
            h(PanelCard, {className: "banner-button", onClick: () => {
                console.log("clicked");
                setStyle(style == whiteStyle ? sateliteStyle : whiteStyle);
                setStyleText(styleText == whiteText ? sateliteText : whiteText);
            }}, styleText),
        ]),
    ])

    return map;
}