import h from "@macrostrat/hyper";
import { MacrostratIcon } from "~/components";
import { LngLatCoords } from "@macrostrat/map-interface";
import { useAPIResult } from "@macrostrat/ui-components";
import { Icon } from "@blueprintjs/core";

export function Image({ src, className, width, height, onClick }) {
    const srcWithAddedPrefix = "https://storage.macrostrat.org/assets/rockd/" + src;
    return h("img", {src: srcWithAddedPrefix, className, width, height, onClick})
}

export function BlankImage({ src, className, width, height, onClick }) {
    return h("img", {src: src, className, width, height, onClick})
}

export function Footer() {
    return h("div", {className: "footer"}, [
        h("div", {className: "titles"}, [
            h("h3", {className: "footer-text top"}, [
                "Produced by the ",
                h("a", {href: "https://macrostrat.org"} , "UW Macrostrat Lab")
            ]),
            h("h3", {className: "footer-text bottom"}, [
                "Funded by ",
                h("a", {href: "https://nsf.gov"}, "NSF"),
                " and ",
                h("a", {href: "http://geoscience.wisc.edu/geoscience/"}, "UW Geoscience")
            ])
        ]),
        h("ul", {className: "footer-links"},[
            h("li", h("a", {href: "/"}, "Home")),
            h("li", h("a", {href: "/explore"}, "Explore")),
            h("li", h("a", {href: "/privacy"}, "Privacy Policy")),
            h("li", h("a", {href: "/terms"}, "Terms and Conditions")),
            h("li", h("a", {href: "/trip/1"}, "Trips")),
            h("li", h("a", {href: "/metrics"}, "Metrics")),
        ])
    ]);
}

export function createCheckins(result, mapRef, marker, sort) {
    let checkins = [];
    let map = mapRef?.current;
    let stop = 0;

    let pinClass = "marker-number";
    if (marker.includes("circle")) {
        pinClass = "circle-number";
    }

    if(sort == "likes") {
        result.sort((a, b) => b.likes - a.likes);
    } else if(sort == "created") {
        result.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    } else if(sort == "added") {
        result.sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());
    } else {
        result.sort((a, b) => b.rating - a.rating);
    }
      
    result.forEach((checkin) => {
        stop++;
        let pin = h('div', 
        { src: "marker_container.png", 
            className: "marker_container", 
            onClick: () => { 
            map.flyTo({center: [checkin.lng, checkin.lat], zoom: 12});
            } 
        }, [
            h(Image, { src: marker, className: "marker" }),
            h('span', { className: pinClass }, stop)
        ])
    
    
        // format rating
        let ratingArr = [];
        for(var i = 0; i < checkin.rating; i++) {
            ratingArr.push(h(Icon, {className: "star", icon: "star", style: {color: 'white'}}));
        }
    
        for(var i = 0; i < 5 - checkin.rating; i++) {
            ratingArr.push(h(Icon, {className: "star", icon: "star-empty", style: {color: 'white'}}));
        }
        
        let image;
        let showImage = imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo);
    
        if (showImage) {
            image = h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo});
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

        let temp = h('div', { className: 'checkin' }, [
            h('h1', {className: 'stop-name'}, stop_name),
            h('div', {className: 'checkin-header'}, [
                h('h3', {className: 'profile-pic'}, h(BlankImage, {src: apiURLOld + "protected/gravatar/" + checkin.person_id, className: "profile-pic"})),
                h('div', {className: 'checkin-info'}, [
                    h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
                    h('h4', {className: 'edited'}, checkin.created),
                    h('p', "Near " + checkin.near),
                    LngLatCoords(LngLatProps),
                    h('h3', {className: 'rating'}, ratingArr),
                ]),
                pin,
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

export function imageExists(image_url){
    var http = new XMLHttpRequest();
  
    http.open('HEAD', image_url, false);
    http.send();
  
    return http.status != 404;
}

export const apiURLOld = "https://rockd.org/api/v2/"; // old route
export const apiURL = "https://rockd.dev.svc.macrostrat.org/api/v2/"; // new route

export function useRockdAPI(src) {
    return useAPIResult(apiURL + src);
}