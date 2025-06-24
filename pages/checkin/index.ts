import { LngLatCoords } from "@macrostrat/map-interface";
import { useState, useCallback } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, Footer, getProfilePicUrl, getImageUrl } from "~/components/general";
import { Icon, Divider } from "@blueprintjs/core";
import h from "./main.module.sass";
import { apiDomain, SETTINGS } from "@macrostrat-web/settings";
import "@macrostrat/style-system";
import { Overlay2 } from "@blueprintjs/core";
import { LithologyList } from "@macrostrat/data-components";
import { ClientOnly } from "vike-react/ClientOnly";
import { useAPIResult } from "@macrostrat/ui-components";
import { a } from "vitest/dist/suite-IbNSsUWN";

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

export function Checkins({checkin}) {
    const allLiths = useAPIResult(apiDomain + "/api/defs/lithologies?all")?.success?.data || [];

    const [overlayOpen, setOverlayOpen] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const center = {
        lat: checkin.lat,
        lng: checkin.lng
    }

    let profile_pic = h('div.profile-header',h(BlankImage, {src: getProfilePicUrl(checkin.person_id), className: "profile-picture"}));
    
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
        h('div', {className: 'observation'}, [
           h('a', {href: "/photo/" + checkin.photo}, 
                h(BlankImage, { className: 'observation-image', src: imageSrc, alt: "presentation" })
            ),
            h("div.observation-body", headerBody),
        ])
    );

    // add observations
    checkin.observations.forEach(observation => {
        if(Object.keys(observation.rocks).length != 0) {
            // if photo exists
            const imageSrc = getImageUrl(checkin.person_id, observation.photo);
            let observationBody = observationFooter(observation);

            observations.push(
                h('div', {className: 'observation'}, [
                    h('a', {href: "/photo/" + observation.photo}, 
                        h(BlankImage, { className: 'observation-image', src: imageSrc })
                    ),
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


    let main = h('div', { className: "container" }, [
        h('div', { className: showMap ? 'hide' : 'main'}, [
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
        h('div', { className: showMap ? 'hide' : 'bottom' }, [
            h(Footer),
        ]),
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

function observationFooter(observation) {
    const [overlayOpen, setOverlayOpen] = useState(false);

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

    let obsAge = observation.age_est ? observation.age_est.name + " (" + observation.age_est.b_age + " - " + observation?.age_est?.t_age + ")" : null;

    let lithologies = [];
    rocks.liths.forEach(lith => {
        if(!lith.color.includes("#")) {
            lithologies.push({
                name: lith.name,
                color: rgbaStringToHex(lith.color)});
        } else {
            lithologies.push(lith);
        }
    });

    if (rocks.strat_name?.strat_name_long) {
        lithologies.push({
            name: rocks.strat_name?.strat_name_long,
        })
    }

    if(rocks.map_unit?.unit_name) {
        lithologies.push({
            name: rocks.map_unit?.unit_name
        })
    }
    
    if(obsAge) {
        lithologies.push({
            name: obsAge
        })
    }
    if(rocks.interval.name) {
        lithologies.push({
            name: rocks.interval.name
        })
    }
    if(observation.orientation.feature?.name) {
        lithologies.push({
            name: observation.orientation.feature?.name
        })
    }

    // observation body
    return h('div', {className: 'observation-body'}, [
        h('button.edit-button', {onClick: () => setOverlayOpen(true)}, "Edit"),
        h(EditObservation, {observation, overlayOpen, setOverlayOpen}),
        observation.lat && rocks.strat_name?.strat_name_long ? h('h4', {className: 'observation-header'}, [
            rocks.strat_name?.strat_name_long,
            observation.lat ? LngLatCoords(LngLatProps) : null,
        ]) : null,
        h('div', {className: 'observation-details'}, [
            h(LithologyList, { lithologies }),
            h('p', {className: "notes"}, rocks.notes),
        ]),
    ]);
}

function EditCheckin({checkin}) {
    console.log("EditCheckin", checkin);
    return h(Overlay2, {
            isOpen: true
        },
        h('div.edit-checkin-container', [
            h('div.edit-checkin-header', [
                h('h1', "Edit Checkin"),
            ]),
            h('div.form-item', [
                h('label', "Notes"),
                h('input', { 
                    type: 'text', 
                    className: 'bp3-input', 
                        defaultValue: checkin.notes, 
                    onChange: (e) => {
                        // Handle note change
                        console.log("New notes:", e.target.value);
                    }
                })
            ]),
        ]) 
    );
}


function EditObservation({observation, overlayOpen, setOverlayOpen}) {
    const liths = observation.rocks.liths || [];
    return h(Overlay2, {
            isOpen: overlayOpen
        },
        h('div.edit-observation-container', [
            h('div.edit-content', [
                h('div.edit-observation-header', [
                    h('h1', "Edit Observation"),
                    h(Icon, {icon: "cross", className: "close-icon", onClick: () => setOverlayOpen(false)}),
                ]),
                h('div.form-item', [
                    h('label', "Liths"),
                    h(LithList, { existingLiths: liths }),
                ]),
            ])
        ]) 
    );
}

function LithologyTag({lith, add, setExisting}) {
    const color = lith.color.includes("#") ? lith.color : `rgba(${lith.color})`;

    return h('div.lithology-tag', {style: {backgroundColor: color}}, [
        h('p', lith.name),
        h.if(!add)(Icon, {icon: "cross", className: "remove-icon", onClick: () => {
            setExisting(existing => existing.filter(e => e.name !== lith.name));
        }} ),
        h.if(add)(Icon, {icon: "plus", className: "add-icon", onClick: () => {
            setExisting(existing => [...existing, lith]);
        }} )
    ]);
}

function LithList({existingLiths}) {
    const [existing, setExisting] = useState(existingLiths || []);

    const liths = useAPIResult(apiDomain + "/api/defs/lithologies?all")?.success?.data.filter(lith => {
        // Filter out existing lithologies
        return !existing.some(existing => existing.name === lith.name);
    }) || [];
    return h('div.lithology-list', [
        existing.map(lith => h(LithologyTag, { lith, add: false, setExisting })),
        h(Divider),
        liths.map(lith => h(LithologyTag, { lith, add: true, setExisting })),
    ]);
}