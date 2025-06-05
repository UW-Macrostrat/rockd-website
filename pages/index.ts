import h from "./layout.module.sass";
import { LngLatCoords } from "@macrostrat/map-interface";
import { DarkModeButton, useAPIResult, useDarkMode } from "@macrostrat/ui-components";
import { Icon } from "@blueprintjs/core";
import mapboxgl from "mapbox-gl";
import { SETTINGS } from "@macrostrat-web/settings";

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
    const isDarkMode = useDarkMode().isEnabled;

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
        h("div", {className: "footer-links"},[
            h("ul", [
                h("li", h("a", {href: "/", onClick: handleClick}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "home", style: {color: 'white'}}),
                    h('p', "Home")
                ])),
                h("li", h("a", {href: "/explore", onClick: handleClick}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "geosearch", style: {color: 'white'}}),
                    h('p', "Explore")
                ])),
                h("li", h("a", {href: "/trip/1", onClick: handleClick}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "route", style: {color: 'white'}}),
                    h('p', "Trip")
                ])),
            ]),
            h("ul", [
                h("li", h("a", {href: "/metrics", onClick: handleClick}, [
                    h(Icon, {className: "footer-icon" + (isDarkMode ? "icon-dark-mode" : ""), icon: "chart", style: {color: 'white'}}),
                    h('p', "Metrics")
                ])),
                h("li", h("a", {href: "/terms", onClick: handleClick}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "manual", style: {color: 'white'}}),
                    h('p', "Terms and Conditions")
                ])),
                h("li", h("a", {href: "/privacy", onClick: handleClick}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "lock", style: {color: 'white'}}),
                    h('p', "Privacy")
                ])),
            ]),
        ]),
        h("div.dark-mode", [
            h(DarkModeButton, {className: "dark-mode-button", showText: true}),
        ]),
    ]);
}

export function createCheckins(result, mapRef, setInspectPosition) {
    const isDarkMode = useDarkMode().isEnabled;
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
        const imgSrc = getImageUrl(checkin.person_id, checkin.photo);
        const showImage = checkin.photo

        if (showImage) {
            image = h(BlankImage, {className: 'observation-img', src: imgSrc});
        } else {
            image = h("div", { className: 'no-image' }, [
                h('h1', "Details"),
                h(Icon, {className: 'details-image', icon: "arrow-right", style: {color: 'white'}})
            ]);
        }

        // for trips
        const stop_name = checkin?.name ?? null;
        const LngLatProps = {
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
                !stop_name ? h('h3', {className: 'profile-pic'}, h(BlankImage, {src: getProfilePicUrl(checkin.person_id), className: "profile-pic"})) : null,
                h('div', {className: 'checkin-info'}, [
                    !stop_name ? h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name) : null,
                    h('h4', {className: 'edited'}, checkin.created),
                    h('p', "Near " + checkin.near),
                    LngLatCoords(LngLatProps),
                    h('h3', {className: 'rating'}, ratingArr),
                ]),
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
                    h(Icon, {className: 'likes-icon ' + (isDarkMode ? "icon-dark-mode" : ""), icon: "thumbs-up", style: {color: 'white'}}),
                    h('h3', {className: 'likes'}, checkin.likes),
                ]),
                h('div', {className: 'observations-container'}, [
                    h(Icon, {className: 'observations-icon ' + (isDarkMode ? "icon-dark-mode" : ""), icon: "camera", style: {color: 'white'}}),
                    h('h3', {className: 'likes'}, checkin.observations.length),
                ]),
                h('div', {className: 'comments-container'}, [
                    h(Icon, {className: 'comments-icon ' + (isDarkMode ? "icon-dark-mode" : ""), icon: "comment", style: {color: 'white'}}),
                    h('h3', {className: 'comments'}, checkin.comments),
                ])
            ]),
        ]);
        
        checkins.push(temp);
    });
    
    return checkins;
}

// remove when metrics works
const apiURL = SETTINGS.rockdApiURL; // new route

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

export function getImageUrl(person_id, photo_id) {
    return apiURL + "/protected/image/" + person_id + "/thumb_large/" + photo_id;
}

export function getProfilePicUrl(person_id) {
    return apiURL + "/protected/gravatar/" + person_id;
}

export function pageCarousel({page, setPage, nextData}) {
    return h('div.pages', 
        h('div.page-container', [
          h('div', { className: "page-btn" }, [
            h('div', { className: page != 1 ? 'btn-content' : 'hide',             
                onClick: () => {
                    setPage(page - 1);
                }}, [
              h(Icon, { icon: 'arrow-left' }),
              h('p', "Previous"),
            ])
          ]),
          h('p', 'Page ' + page),
          h('div', { className: "page-btn" }, [
            h('div', { className: nextData && nextData?.length > 0 ? 'btn-content' : 'hide',
                onClick: () => {
                    setPage(page + 1);
                }
            }, [
              h('p', "Next"),
              h(Icon, { icon: 'arrow-right' }),
            ])
          ]),
        ])
      );
}