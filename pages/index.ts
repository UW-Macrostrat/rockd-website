import hyper from "@macrostrat/hyper";
import { LngLatCoords } from "@macrostrat/map-interface";
import { useAPIResult } from "@macrostrat/ui-components";
import { Icon } from "@blueprintjs/core";
import mapboxgl from "mapbox-gl";
import styles from "./main.module.sass";
import { useNavigate } from 'react-router-dom';

const h = hyper.styled(styles);


export function Image({ src, className, width, height, onClick }) {
    const srcWithAddedPrefix = "https://storage.macrostrat.org/assets/rockd/" + src;
    return h("img", {src: srcWithAddedPrefix, className, width, height, onClick})
}

export function BlankImage({ src, className, width, height, onClick, onError, alt }) {
    return h("img", {src: src, className, width, height, onClick, onError, alt})
}

const handleClick = (e) => {
    // Custom logic to navigate or do something without style transfer
};

export function Footer() {
    return h("div", {className: "footer"}, [
        h("div", {className: "titles"}, [
            h("h3", {className: "footer-text upper"}, [
                "Produced by the ",
                h("a", {href: "https://macrostrat.org"} , "UW Macrostrat Lab")
            ]),
            h("h3", {className: "footer-text lower"}, [
                "Funded by ",
                h("a", {href: "https://nsf.gov"}, "NSF"),
                " and ",
                h("a", {href: "http://geoscience.wisc.edu/geoscience/"}, "UW Geoscience")
            ])
        ]),
        h("ul", {className: "footer-links"},[
            h("li", h("a", {href: "/", onClick: handleClick}, "Home")),
            h("li", h("a", {href: "/explore", onClick: handleClick}, "Explore")),
            h("li", h("a", {href: "/privacy", onClick: handleClick}, "Privacy Policy")),
            h("li", h("a", {href: "/terms", onClick: handleClick}, "Terms and Conditions")),
            h("li", h("a", {href: "/trip/1", onClick: handleClick}, "Trips")),
            h("li", h("a", {href: "/metrics", onClick: handleClick}, "Metrics")),
        ])
    ]);
}

export function createCheckins(result, mapRef, setInspectPosition) {
    let checkins = [];
    const map = mapRef?.current;

    const len = result.length;
      
    result.forEach((checkin) => {    
        // format rating
        let ratingArr = [];
        for(var i = 0; i < checkin.rating; i++) {
            ratingArr.push(h(Icon, {className: "star", icon: "star", style: {color: 'white'}}));
        }
    
        for(var i = 0; i < 5 - checkin.rating; i++) {
            ratingArr.push(h(Icon, {className: "star", icon: "star-empty", style: {color: 'white'}}));
        }
        
        let image;
        const imgSrc = apiURL + "protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo;
        const showImage = checkin.photo //&& imageExists(imgSrc); // causing lag
    
        if (showImage) {
            image = h(BlankImage, {className: 'observation-img', src: apiURL + "protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo});
        } else {
            image = h("div", { className: 'no-image' }, [
                h('h1', "Details"),
                h(Icon, {className: 'details-image', icon: "arrow-right", style: {color: 'white'}})
            ]);
        }

        // for trips
        let stop_name = checkin?.name ?? null;
        let LngLatProps = {
            position: {
                lat: checkin.lat,
                lng: checkin.lng
            },
            precision: 3,
            zoom: 10
        };

        let temp = h('div', { 
                className: 'checkin', 
                onClick: () => { 
                    map.flyTo({center: [checkin.lng, checkin.lat], zoom: 12});
                    if(setInspectPosition) setInspectPosition({lat: checkin.lat, lng: checkin.lng});
                }, 
                onMouseEnter: () => {
                    if (len > 1) {
                        // marker
                        const el = document.createElement('div');
                        el.className = 'marker_pin';

                        // Create marker
                        new mapboxgl.Marker(el)
                        .setLngLat([checkin.lng, checkin.lat])
                        .addTo(map);
                    }
                },
                onMouseLeave: () => {
                    let previous = document.querySelectorAll('.marker_pin');
                    previous.forEach((marker) => {
                        marker.remove();
                    });
                } 
            }, [
            h('h1', {className: 'stop-name'}, stop_name),
            h('div', {className: 'checkin-header'}, [
                h('h3', {className: 'profile-pic'}, h(BlankImage, {src: apiURL + "protected/gravatar/" + checkin.person_id, className: "profile-pic"})),
                h('div', {className: 'checkin-info'}, [
                    h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
                    h('h4', {className: 'edited'}, checkin.created),
                    h('p', "Near " + checkin.near),
                    LngLatCoords(LngLatProps),
                    h('h3', {className: 'rating'}, ratingArr),
                ]),
                // pin,
                ]),
                h('p', {className: 'description'}, checkin.notes),
                h('a', {className: 'checkin-link', href: "/checkin/" + checkin.checkin_id, target: "_blank"}, [
                image,
                showImage ? h('div', {className: "image-details"}, [
                    h('h1', "Details"),
                    h(Icon, {className: 'details-image', icon: "arrow-right", style: {color: 'white'}})
                ]) : null
                ]),
                h('div', {className: 'checkin-footer'}, [
                h('div', {className: 'likes-container'}, [
                    h(Icon, {className: 'likes-icon', icon: "thumbs-up", style: {color: 'white'}}),
                    h('h3', {className: 'likes'}, checkin.likes),
                ]),
                h('div', {className: 'observations-container'}, [
                    h(Icon, {className: 'observations-icon', icon: "camera", style: {color: 'white'}}),
                    h('h3', {className: 'likes'}, checkin.observations.length),
                ]),
                h('div', {className: 'comments-container'}, [
                    h(Icon, {className: 'comments-icon', icon: "comment", style: {color: 'white'}}),
                    h('h3', {className: 'comments'}, checkin.comments),
                ])
            ]),
        ]);
        
        checkins.push(temp);
    });
    
    return checkins;
}
export const apiURLOld = "https://rockd.org/api/v2/"; // old route
export const apiURL = "https://rockd.dev.svc.macrostrat.org/api/v2/"; // new route

export function useRockdAPI(src) {
    return useAPIResult(apiURL + src);
}

export function imageExists(url) {
    var http = new XMLHttpRequest();
    try {
        http.open('HEAD', url, false);
        http.send();
    } catch (e) {
        return true;
    }
    return false
}