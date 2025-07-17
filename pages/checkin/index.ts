import { LngLatCoords } from "@macrostrat/map-interface";
import { useState, useCallback } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, Footer, getProfilePicUrl, getImageUrl, Comments } from "~/components/general";
import { Icon, Divider, H2 } from "@blueprintjs/core";
import h from "./main.module.sass";
import { rockdApiOldURL, SETTINGS } from "@macrostrat-web/settings";
import "@macrostrat/style-system";
import { Overlay2 } from "@blueprintjs/core";
import { LithologyList } from "@macrostrat/data-components";
import { ClientOnly } from "vike-react/ClientOnly";
import { macrostratApiURL } from "@macrostrat-web/settings";
import { ContentPage } from "~/layouts";

function Map(props) {
  return h(
    ClientOnly,
    {
      load: () => import("./map.client").then((d) => d.MapContainer),
      fallback: h("div.loading", "Loading map..."),
    },
    (component) => h(component, props)
  );
}

export function Checkins({checkin, comments}) {
    if (checkin === undefined) {
        return h('div', [
            h(ContentPage, [
                h('h2', "Checkin not found"),
                h(Divider),
                h('p', "This checkin does not exist or has been deleted."),
            ]),
            h(Footer)
        ]);
    }
    const center = {
        lat: checkin.lat,
        lng: checkin.lng
    }

    let profile_pic = h('div.profile-header', h(BlankImage, {src: getProfilePicUrl(checkin.person_id), className: "profile-picture"}));
    
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
    const imageSrc = getImageUrl(checkin.person_id, checkin.photo);
    const headerBody = h('h4', {className: 'observation-header'}, checkin.notes);

    observations.push(
        h.if(checkin.photo || checkin.notes)('div', {className: 'observation'}, [
           h.if(checkin.photo)('a', {href: "/photo/" + checkin.photo}, 
                h(BlankImage, { className: 'observation-image', src: imageSrc, alt: "presentation" })
            ),
            h("div.observation-body", headerBody),
        ])
    );

    // add observations
    checkin.observations.forEach(observation => {
        // if photo exists
        const imageSrc = getImageUrl(checkin.person_id, observation.photo);

        console.log("Observation data:", observation);

        observations.push(
            h.if(observation.photo || observation.lat || observation.lng || !objectNull(observation.fossils) || !objectNull(observation.minerals) || !objectNull(observation.rocks))('div', {className: 'observation'}, [
                h.if(observation.photo)('a', {href: "/photo/" + observation.photo}, 
                    h(BlankImage, { className: 'observation-image', src: imageSrc })
                ),
                h(ObservationFooter, {observation}),
            ])
        );
    });

    let LngLatProps = {
        position: {
            lat: checkin.lat,
            lng: checkin.lng
        },
        precision: 3,
        zoom: 10
    };


    let main = h('div', { className: "container" }, [
        h('div', { className: 'main'}, [
            h('div', { className: "checkin-head" }, [
                h('h1', checkin.notes),
            ]),
            h(Overlay, {
                checkin,
                center,
                LngLatProps,
                ratingArr,
                profile_pic,
            }),
            h('div', { className: 'observations' }, observations),
        ]),
        h.if(comments?.length > 0)('div.comments-container', [
            h('h2', 'Comments'),
            h(Divider),
            h(Comments, { comments }),
        ]),
        h(Footer),
    ])

    return main;
}

function Overlay({checkin, center, LngLatProps, ratingArr, profile_pic}) {
    const [overlayOpen, setOverlayOpen] = useState(false);
    const map = h(Map, {center, setOverlayOpen});

    return h('div.overlay', [
         h.if(!overlayOpen)(BlankImage, { className: "location-img", src: "https://api.mapbox.com/styles/v1/jczaplewski/cje04mr9l3mo82spihpralr4i/static/geojson(%7B%22type%22%3A%22Point%22%2C%22coordinates%22%3A%5B" + checkin.lng + "%2C" + checkin.lat + "%5D%7D)/" + checkin.lng + "," + checkin.lat + ",5,0/1200x400?access_token=" + SETTINGS.mapboxAccessToken }),
            h.if(!overlayOpen)('div', { className: 'stop-header', onClick: () => { setOverlayOpen(true); console.log("center", center) } }, [
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
            h(Overlay2, { 
            isOpen: overlayOpen, 
            onClose: () => setOverlayOpen(false), 
            className: "map",
            usePortal: true,
            canEscapeKeyClose: true,
            canOutsideClickClose: true,
            hasBackdrop: false,
        }, map),
    ])      
}

export function ObservationFooter({observation}) {
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
    for(var j = 0; j < rocks?.liths?.length; j++) {                
        liths.push(h('p', { className: "observation-detail liths"}, rocks.liths[j].name));
    }    

    function rgbaStringToHex(rgba: string): string {
        // Split the input string by commas and trim whitespace
        const values = rgba.split(',').map(value => value.trim());
    
        // Extract r, g, b values and ignore alpha
        const r = parseInt(values[0], 10);
        const g = parseInt(values[1], 10);
        const b = parseInt(values[2], 10);
    
        // Convert r, g, b to two-digit hex values
        const red = r.toString(16).padStart(2, '0');
        const green = g.toString(16).padStart(2, '0');
        const blue = b.toString(16).padStart(2, '0');
    
        // Return the HEX string without alpha
        return `#${red}${green}${blue}`;
    }

    let lithologies = [];
    rocks.liths?.forEach(lith => {
        if(!lith.color.includes("#")) {
            lithologies.push({
                ...lith,
                color: rgbaStringToHex(lith.color),
            });
        } else {
            lithologies.push(lith);
        }
    });

    if(rocks.interval?.name) {
        lithologies.push({
            name: rocks.interval.name,
            int_id: rocks.interval.int_id,
            color: rocks.interval.color.includes("#") ? rocks.interval.color : `rgba(${rocks.interval.color})`,
        })
    }

    if (rocks.strat_name?.strat_name_long) {
        lithologies.push({
            name: rocks.strat_name?.strat_name_long,
            strat_id: rocks.strat_name?.strat_name_id
        })
    }

    if(rocks.map_unit?.unit_name) {
        lithologies.push({
            name: rocks.map_unit?.unit_name
        })
    }
    
    if(observation.orientation.feature?.name) {
        lithologies.push({
            name: observation.orientation.feature?.name
        })
    }

    const show = lithologies.length > 0 || rocks?.notes?.length > 0 && observation.lat && rocks.strat_name?.strat_name_long;

    const handleClick = (e, data) => {
        if (data.int_id) {
            window.open(macrostratApiURL + `/lex/intervals/${data.int_id}`, '_blank');
        }
        if (data.strat_id) {
            window.open(macrostratApiURL + `/lex/strat-names/${data.strat_id}`, '_blank');
        }
        if (data.lith_id) {
            window.open(macrostratApiURL + `/lex/lithology/${data.lith_id}`, '_blank');
        }
    };

    console.log("Rocks data:", lithologies);

    // observation body
    return h.if(show)("div", {className: 'observation-body'}, [
        observation.lat && rocks.strat_name?.strat_name_long ? h('h4', {className: 'observation-header'}, [
            rocks.strat_name?.strat_name_long,
            observation.lat ? LngLatCoords(LngLatProps) : null,
        ]) : null,
        h('div', {className: 'observation-details'}, [
            h(LithologyList, { lithologies, onClickItem: handleClick }),
            h('p', {className: "notes"}, rocks.notes),
        ]),
    ]);
}

function objectNull(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}