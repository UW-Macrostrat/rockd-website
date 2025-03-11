import h from "@macrostrat/hyper";
import { LngLatCoords } from "@macrostrat/map-interface";
import { useEffect, useState, useRef } from 'react';
import { usePageContext } from 'vike-react/usePageContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, Image, Footer, apiURL, apiURLOld, useRockdAPI } from "../index";
import "../main.styl";
import { SETTINGS } from "@macrostrat-web/settings";
import { DarkModeButton } from "@macrostrat/ui-components";
import "./main.sass";
import "@macrostrat/style-system";
import { MapAreaContainer, MapView, MapMarker } from "@macrostrat/map-interface";
import 'mapbox-gl/dist/mapbox-gl.css';
import { checkIfClientRouting } from "vike/dist/esm/utils/assertRoutingType";
import { MapPosition } from "@macrostrat/mapbox-utils";
import { set } from "react-datepicker/dist/date_utils";


function imageExists(image_url){
    var http = new XMLHttpRequest();
  
    http.open('HEAD', image_url, false);
    http.send();
  
    return http.status != 404;
}

export function Page() {
    const pageContext = usePageContext();
    const checkinID = pageContext.urlParsed ? parseInt(pageContext.urlParsed.search.checkin) : null;
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
            h("h1", "Checkin " + checkinID + " not found"),  
        ]); 
    }

    const checkin = checkinData.success.data[0];
    const center = {
        lat: checkin.lat,
        lng: checkin.lng
    }

    let profile_pic = h(BlankImage, {src: apiURLOld + "protected/gravatar/" + checkin.person_id, className: "profile-pic"});
    
    // format rating
    let ratingArr = [];
    for(var i = 0; i < checkin.rating; i++) {
        ratingArr.push(h(Image, {className: "star", src: "blackstar.png"}));
    }

    // get observations
    let observations = [];

    // add checkin photo and notes
    let headerImgUrl = imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo) && checkin.photo != null ? "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo : "https://storage.macrostrat.org/assets/rockd/rockd.jpg";
    let headerBody = h('h4', {className: 'observation-header'}, checkin.notes);

    observations.push(
        h('div', {className: 'observation'}, [
            h(BlankImage, { className: 'observation-img', src: headerImgUrl, onClick: () => {
                setOverlayBody(h('div.observation-body',headerBody));
                setOverlayImage(headerImgUrl);
                setOverlayOpen(!overlayOpen);
                }
            }),
            headerBody,
        ])
    );

    // add observations
    for(var i = 0; i < checkin.observations.length; i++) {
        let observation = checkin.observations[i];

        if(Object.keys(observation.rocks).length != 0) {
            // get liths
            let liths = [];
            for(var j = 0; j < observation.rocks.liths.length; j++) {                
                liths.push(h('p', observation.rocks.liths[j].name));
            }
            

            let LngLatProps = {
                position: {
                    lat: observation.lat,
                    lng: observation.lng
                },
                precision: 3,
                zoom: 10
            };

            // if photo exists
            let imageSrc;
            imageSrc = imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + observation.photo) ? "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + observation.photo : "https://storage.macrostrat.org/assets/rockd/rockd.jpg";
            let obsAge = observation.age_est ? observation.age_est.name + " (" + observation.age_est.b_age + " - " + observation?.age_est?.t_age + ")" : null;
            let observationBody = h('div', {className: 'observation-body'}, [
                h('h4', {className: 'observation-header'}, observation.rocks.strat_name?.strat_name_long),
                h('div', {className: 'observation-details'}, [
                    h('p', {className: 'observation-detail'}, observation.rocks.strat_name?.strat_name_long),
                    h('p', {className: 'observation-detail'}, observation.rocks.map_unit?.unit_name),
                    h('p', {className: 'observation-detail'}, obsAge),
                    h('p', {className: 'observation-detail'}, liths),
                    h('p', {className: 'observation-detail'}, observation.orientation.feature?.name),
                    LngLatCoords(LngLatProps)
                ]),
            ]);

            observations.push(
                h('div', {className: 'observation'}, [
                    h(BlankImage, { className: 'observation-img', src: imageSrc, onClick: () => {
                        setOverlayImage(imageSrc);
                        setOverlayBody(observationBody);
                        setOverlayOpen(!overlayOpen);
                    }}),
                    observationBody,
                ])
            );
        }        
    }

    const newMapPosition: MapPosition = {
        camera: {
          lat: center.lat,  // Latitude
          lng: center.lng, // Longitude
          altitude: 300000, // Altitude (height from the Earth's surface)
        },
      };

    let map = h(MapAreaContainer,
            [
              h(MapView, { style: 'mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i', mapboxToken: SETTINGS.mapboxAccessToken, mapPosition: newMapPosition }, [
                h(MapMarker, {
                    position: center,
                   }),
              ]),
              h('div', {className: 'banner', onClick: () => {
                setShowMap(!showMap);
              }}, h(Image, { className: 'left-arrow', src: "checkins/left-arrow.png"})),
            ]
          );

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
        h('div', {className: 'banner', onClick: () => {
            setOverlayOpen(!overlayOpen);
        }}, h(Image, { className: 'left-arrow', src: "checkins/left-arrow.png"})),

        h('div.overlay-body', [
            h(BlankImage, { className: 'observation-img', src: overlayImage }),
            overlayBody,
        ])
    ]);

    let main = h('div', [
        h('div', { className: showMap ? 'hide' : 'main'}, [
            h('h1', { className: "checkin-header" }, checkin.description),
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
            h(DarkModeButton, { className: 'dark-mode-button', showText: true }),
        ]),
        h('div', { className: !showMap ? 'hide' : 'map'}, map)
    ])


    return overlayOpen ? overlay : main;
}