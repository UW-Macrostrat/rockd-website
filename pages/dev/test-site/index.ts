import h from "@macrostrat/hyper";
import { MacrostratIcon } from "~/components";

export function Image({ src, className, width, height, onClick }) {
    const srcWithAddedPrefix = "https://storage.macrostrat.org/assets/rockd/" + src;
    return h("img", {src: srcWithAddedPrefix, className, width, height, onClick})
}

export function BlankImage({ src, className, width, height }) {
    return h("img", {src: src, className, width, height})
}

export function Navbar() {
    return h("div", {className: "nav"}, [
        h("ul", [
            h("li", h("a", {href: "/dev/test-site/main-page"}, h(MacrostratIcon))),
            h("li", h("a", {href: "/dev/test-site/about"}, "About")),
            h("li", h("a", {href: "/dev/test-site/publications"}, "Publications")),
            h("li", h("a", {href: "/dev/test-site/people"}, "People")),
            h("li", h("a", {href: "/dev/test-site/donate"}, "Donate"))
        ])
    ]);
}

export function Footer() {
    return h("div", {className: "footer"}, [
        h("div", {className: "titles"}, [
            h("h3", {className: "footer-text"}, [
                "Produced by the ",
                h("a", {href: "https://macrostrat.org"} , "UW Macrostrat Lab")
            ]),
            h("h3", {className: "footer-text"}, [
                "Funded by ",
                h("a", {href: "https://nsf.gov"}, "NSF"),
                " and ",
                h("a", {href: "http://geoscience.wisc.edu/geoscience/"}, "UW Geoscience")
            ])
        ]),
        h("ul", {className: "footer-links"},[
            h("li", h("a", {href: "/dev/test-site"}, "Home")),
            h("li", h("a", {href: "/dev/test-site/explore"}, "Explore")),
            h("li", h("a", {href: "/dev/test-site/privacy"}, "Privacy Policy")),
            h("li", h("a", {href: "/dev/test-site/terms"}, "Terms and Conditions")),
            h("li", h("a", {href: "/dev/test-site/trip?trip=1"}, "Trips")),
            h("li", h("a", {href: "/dev/test-site/metrics"}, "Metrics")),
        ])
    ]);
}

export function createCheckins(result, mapRef, marker) {
    let checkins = [];
    let map = mapRef?.current;
    let stop = 0;
      
    result.forEach((checkin) => {
        stop++;
        let pin = h('div', 
        { src: "marker_container.png", 
            className: "marker_container", 
            onClick: () => { 
            map.flyTo({center: [checkin.lng, checkin.lat], zoom: 12});
            } 
        }, [
            h(Image, { src: "explore/" + marker, className: "marker" }),
            h('span', { className: "marker-number" }, stop)
        ])
    
    
        // format rating
        let ratingArr = [];
        for(var i = 0; i < checkin.rating; i++) {
            ratingArr.push(h(Image, {className: "star", src: "blackstar.png"}));
        }
    
        for(var i = 0; i < 5 - checkin.rating; i++) {
        ratingArr.push(h(Image, {className: "star", src: "emptystar.png"}));
        }
        let image;
    
        if (imageExists("https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo)) {
        image = h(BlankImage, {className: 'observation-img', src: "https://rockd.org/api/v1/protected/image/" + checkin.person_id + "/thumb_large/" + checkin.photo});
        } else {
        image = h(Image, { className: 'observation-img', src: "rockd.jpg"});
        }
        
    
        let temp = h('div', { className: 'checkin' }, [
            h('div', {className: 'checkin-header'}, [
            h('h3', {className: 'profile-pic'}, h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + checkin.person_id, className: "profile-pic"})),
            h('div', {className: 'checkin-info'}, [
                h('h3', {className: 'name'}, checkin.first_name + " " + checkin.last_name),
                h('h4', {className: 'edited'}, checkin.created),
                h('p', "Near " + checkin.near),
                h('h3', {className: 'rating'}, ratingArr),
            ]),
            pin,
            ]),
            h('p', {className: 'description'}, checkin.notes),
            h('a', {className: 'checkin-link', href: "/dev/test-site/checkin?checkin=" + checkin.checkin_id, target: "_blank"}, [
            image,
            h('div', {className: "image-details"}, [
                h('h1', "Details"),
                h(Image, {className: 'details-image', src: "explore/white-arrow.png"})
            ])
            ]),
            h('div', {className: 'checkin-footer'}, [
            h('div', {className: 'likes-container'}, [
                h(Image, {className: 'likes-image', src: "explore/thumbs-up.png"}),
                h('h3', {className: 'likes'}, checkin.likes),
            ]),
            h('div', {className: 'observations-container'}, [
                h(Image, {className: 'observations-image', src: "explore/observations.png"}),
                h('h3', {className: 'comments'}, checkin.observations.length),
            ]),
            h('div', {className: 'comments-container'}, [
                h(Image, {className: 'comments-image', src: "explore/comment.png"}),
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