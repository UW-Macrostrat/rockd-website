import hyper from "@macrostrat/hyper";
import { LngLatCoords } from "@macrostrat/map-interface";
import { useState, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, imageExists, Image, apiURL, useRockdAPI } from "../index";
import { Icon } from "@blueprintjs/core";
import styles from "../main.module.sass";
import "./main.sass";
import "@macrostrat/style-system";
import 'mapbox-gl/dist/mapbox-gl.css';
import { LithologyList } from "@macrostrat/data-components";

const h = hyper.styled(styles);

export function Photos({photoID, checkinData}) {
    const [showBody, setBody] = useState(true);
    const checkin = checkinData.success.data[0];
    let photoIDArr = [checkin.photo];

    console.log(checkin);

    
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
            headerImgUrl ? h(BlankImage, { className: 'observation-image', src: headerImgUrl}) : null,
            h("div.observation-body", headerBody),
        ])
    );

    // add observations
    checkin.observations.forEach(observation => {
        if(Object.keys(observation.rocks).length != 0) {
            photoIDArr.push(observation.photo);
            // if photo exists
            const imageSrc = apiURL + "protected/image/" + checkin.person_id + "/thumb_large/" + observation.photo;
            const observationURL = observation.photo && imageExists(imageSrc) ? imageSrc : null;
            let observationBody = h('div.observation-body-container', observationFooter(observation, setBody));

            observations.push(
                h('div', {className: 'observation'}, [
                    observationURL ? h(BlankImage, { className: 'observation-image', src: observationURL}) : null,
                    showBody ? observationBody : null,
                    !showBody ? h(Icon, {className: "info-btn", icon: "info-sign", onClick: () => {
                        setBody(true)
                    }}) : null,
                ])
            );
        }        
    });

    console.log("arr",photoIDArr)
    const photoIndex = photoIDArr.indexOf(photoID);
    const observation = observations[photoIndex];
    const leftArrow = h(Icon, {className: "left-arrow", icon: "arrow-left", style: { color: 'white'}});
    const rightArrow = h(Icon, {className: "right-arrow", icon: "arrow-right", style: {color: 'white'}});

    let footer = [];
    photoIDArr.forEach(photo => {
        if(photo == photoID) {
            footer.push(
                h('div', 
                    h(Icon, {icon: "symbol-circle", style: {color: "grey"}}),
                )
            )
        } else {
            footer.push(
                h("a", {href: "/photo/" + photo}, 
                    h(Icon, {icon: "symbol-circle", style: {color: "white"}}),
                )
            )
        }
    });

    return h('div', { className: "container" }, [
        h('div.photo-banner', [
            h("a", { href: "/" }, 
                h(Image, { className: "home-icon", src: "favicon-32x32.png" }),
            ),
            h("a", {href: "/checkin/" + checkin.checkin_id}, [
                h(Icon, {icon: "arrow-left", style: {color: "white"}}),
                h('h3', "CHECKIN")
            ]),
        ]),
        h("div", {className: "photos"}, [
            photoIndex != 0 ? h("a", {href: "/photo/" + (photoIDArr[photoIndex -1])}, leftArrow) : null,
            observation,
            photoIndex != photoIDArr.length - 1 ? h("a", {href: "/photo/" + photoIDArr[photoIndex + 1]}, rightArrow) : null,
        ]),
        h('div.circles',footer),
    ])
}

function observationFooter(observation, setBody) {
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
        observation.lat && rocks.strat_name?.strat_name_long ? h('h4', {className: 'observation-header'}, [
            rocks.strat_name?.strat_name_long,
            observation.lat ? LngLatCoords(LngLatProps) : null,
        ]) : null,
        h('div', {className: 'observation-details'}, [
            h(LithologyList, { lithologies }),
            h('p', {className: "notes"}, rocks.notes),
        ]),
        h(Icon, {className: "close-body", icon: "ban-circle", onClick: () => {
            setBody(false)
        }})
    ]);
}