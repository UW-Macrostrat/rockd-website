import h from "./layout.module.sass";
import { DarkModeButton, useAPIResult, useDarkMode } from "@macrostrat/ui-components";
import { Icon } from "@blueprintjs/core";
import { SETTINGS } from "@macrostrat-web/settings";
import { rockdApiOldURL, rockdApiURL } from "@macrostrat-web/settings";

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
                h("li", h("a", {href: "/"}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "home", style: {color: 'white'}}),
                    h('p', "Home")
                ])),
                h("li", h("a", {href: "/explore"}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "geosearch", style: {color: 'white'}}),
                    h('p', "Explore")
                ])),
                h("li", h("a", {href: "/trip/1"}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "route", style: {color: 'white'}}),
                    h('p', "Trip")
                ])),
            ]),
            h("ul", [
                h("li", h("a", {href: "/metrics"}, [
                    h(Icon, {className: "footer-icon" + (isDarkMode ? "icon-dark-mode" : ""), icon: "chart", style: {color: 'white'}}),
                    h('p', "Metrics")
                ])),
                h("li", h("a", {href: "/terms"}, [
                    h(Icon, {className: "footer-icon"+ (isDarkMode ? "icon-dark-mode" : ""), icon: "manual", style: {color: 'white'}}),
                    h('p', "Terms and Conditions")
                ])),
                h("li", h("a", {href: "/privacy"}, [
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


export function Image({ src, className, width, height, onClick }) {
    const srcWithAddedPrefix = "https://storage.macrostrat.org/assets/rockd/" + src;
    return h("img", {src: srcWithAddedPrefix, className, width, height, onClick})
}

export function BlankImage({ src, className, width, height, onClick, onError, alt }) {
    return h("img", {src: src, className, width, height, onClick, onError, alt})
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

export function fetchAPIData(url) {
    return fetch(rockdApiURL + url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            throw error;
        });
}

export function fetchAPIDataOld(url) {
    return fetch(rockdApiOldURL + url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            throw error;
        });
}