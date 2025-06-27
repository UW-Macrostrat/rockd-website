import h from "./layout.module.sass";
import { LngLatCoords } from "@macrostrat/map-interface";
import {
  DarkModeButton,
  useAPIResult,
  useDarkMode,
} from "@macrostrat/ui-components";
import { Icon, Divider } from "@blueprintjs/core";
import mapboxgl from "mapbox-gl";
import { SETTINGS } from "@macrostrat-web/settings";
import { rockdApiURL, rockdApiOldURL } from "@macrostrat-web/settings";
import { useState } from "react";
import { navigate } from "vike/client/router";

export function Footer() {
  const footerLinks1 = [
    { href: "/", icon: "home", text: "Home" },
    { href: "/explore", icon: "geosearch", text: "Explore" },
    { href: "/trip/1", icon: "route", text: "Trip" },
  ];

  const footerLinks2 = [
    { href: "/metrics", icon: "chart", text: "Metrics" },
    { href: "/terms", icon: "manual", text: "Terms and Conditions" },
    { href: "/privacy", icon: "lock", text: "Privacy" },
  ];

  return h("div", { className: "footer" }, [
    h("div", { className: "titles" }, [
      h("h3", { className: "footer-text upper" }, [
        "Produced by the ",
        h("a", { href: "https://macrostrat.org" }, "UW Macrostrat Lab"),
      ]),
      h("h3", { className: "footer-text lower" }, [
        "Funded by ",
        h("a", { href: "https://nsf.gov" }, "NSF"),
        " and ",
        h(
          "a",
          { href: "http://geoscience.wisc.edu/geoscience/" },
          "UW Geoscience"
        ),
      ]),
    ]),
    h("div", { className: "footer-links" }, [
      h("ul", footerLinks1.map((props) => h(FooterLink, props))),
      h("ul", footerLinks2.map((props) => h(FooterLink, props))),
    ]),
    h("div.dark-mode", [
      h(DarkModeButton, { className: "dark-mode-button", showText: true }),
    ]),
  ]);
}

function FooterLink({ href, icon, text }) {
  const isDarkMode = useDarkMode().isEnabled;

  return h("li", { onClick: (e) => {
      e.preventDefault(); 
      window.open(href, "_self"); 
  }}, [
    h(Icon, {
      className: "footer-icon",
      icon,
      style: { color: isDarkMode ? "black" : "white" },
    }),
    h("p", text),
  ]);
}


export function Image(props: ImageProps) {
    const { src, className, width, height, onClick, alt } = props
   const [hasError, setHasError] = useState(false);
   const srcWithAddedPrefix =
    "https://storage.macrostrat.org/assets/rockd/" + src;

    if (!src || hasError) {
        return null;
    }

    return h("img", {
        src: srcWithAddedPrefix,
        className,
        width,
        height,
        onClick,
        onError: () => setHasError(true),
        alt,
    });
}

interface ImageProps {
  src: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
  alt?: string; 
  onError?: () => void; 
}

export function TestImage({ src, onError, onLoad }) {
  return h("img", {
    src,
    onError,
    onLoad,
  });
}

export function BlankImage(props: ImageProps) {
   const { src, className, width, height, onClick, alt } = props
   const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return null;
    }

    return h("img", {
        src,
        className,
        width,
        height,
        onClick,
        onError: () => setHasError(true),
        alt,
    });
}

// remove when metrics works
const apiURL = SETTINGS.rockdApiURL; // new route

export function useRockdAPI(src) {
  return useAPIResult(apiURL + src);
}

function imageExists(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = Image({ src });

    img.onload = () => resolve(true); // No error
    img.onerror = () => resolve(false); // Error occurred
  });
}

export function getImageUrl(person_id, photo_id) {
  return apiURL + "/protected/image/" + person_id + "/thumb_large/" + photo_id;
}

export function getProfilePicUrl(person_id) {
  return apiURL + "/protected/gravatar/" + person_id;
}

export function pageCarousel({ page, setPage, nextData }) {
  return h(
    "div.pages",
    h("div.page-container", [
      h("div", { className: "page-btn" }, [
        h(
          "div",
          {
            className: page != 1 ? "btn-content" : "hide",
            onClick: () => {
              setPage(page - 1);
            },
          },
          [h(Icon, { icon: "arrow-left" }), h("p", "Previous")]
        ),
      ]),
      h("p", "Page " + page),
      h("div", { className: "page-btn" }, [
        h(
          "div",
          {
            className:
              nextData && nextData?.length > 0 ? "btn-content" : "hide",
            onClick: () => {
              setPage(page + 1);
            },
          },
          [h("p", "Next"), h(Icon, { icon: "arrow-right" })]
        ),
      ]),
    ])
  );
}

export async function fetchAPIData(url) {
  console.log("Fetching data from:", rockdApiURL + url);
  return fetch(rockdApiURL + url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      throw error;
    });
}

export function fetchAPIDataOld(url) {
  return fetch(rockdApiOldURL + url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      throw error;
    });
}

export function createCheckins(result, mapRef, setInspectPosition) {
  const len = result.length;

  return result.map((checkin, index) =>
    h(Checkin, {  
      checkin,
      mapRef,
      setInspectPosition,
      len,
      key: checkin.checkin_id || index, 
    })
  );
}

function Checkin({checkin, mapRef, setInspectPosition, len}) {
    const [hasError, setHasError] = useState(false);
    const isDarkMode = useDarkMode().isEnabled;
    const map = mapRef?.current;
    // format rating
    let ratingArr = [];
    for (var i = 0; i < checkin.rating; i++) {
      ratingArr.push(
        h(Icon, { className: "star", icon: "star", style: { color: "white" } })
      );
    }

    for (var i = 0; i < 5 - checkin.rating; i++) {
      ratingArr.push(
        h(Icon, {
          className: "star",
          icon: "star-empty",
          style: { color: "white" },
        })
      );
    }

    

    let image;
    const imgSrc = getImageUrl(checkin.person_id, checkin.photo);

    const test = h(TestImage, {
      src: imgSrc,
      onError: () => setHasError(true),
    });

    const showImage = !hasError;

    if (showImage) {
      image = h(BlankImage, { className: "observation-img", src: imgSrc });
    } else {
      image = h("div", { className: "no-image" }, [
        h("h1", "Details"),
        h(Icon, {
          className: "details-image",
          icon: "arrow-right",
          style: { color: "black" },
        }),
      ]);
    }

    // for trips
    const stop_name = checkin?.name ?? null;
    const LngLatProps = {
      position: {
        lat: checkin.lat,
        lng: checkin.lng,
      },
      precision: 3,
      zoom: 10,
    };

    let temp = h(
      "div",
      {
        className: "checkin",
        onClick: () => {
          map.flyTo({ center: [checkin.lng, checkin.lat], zoom: 12 });
          if (setInspectPosition)
            setInspectPosition({ lat: checkin.lat, lng: checkin.lng });
        },
        onMouseEnter: () => {
          if (len > 1) {
            // marker
            const el = document.createElement("div");
            el.className = "marker_pin";

            // Create marker
            new mapboxgl.Marker(el)
              .setLngLat([checkin.lng, checkin.lat])
              .addTo(map);
          }
        },
        onMouseLeave: () => {
          let previous = document.querySelectorAll(".marker_pin");
          previous.forEach((marker) => {
            marker.remove();
          });
        },
      },
      [
        h('div', {className: "hide"}, test),
        h("h1", { className: "stop-name" }, stop_name),
        h("div", { className: "checkin-header" }, [
          !stop_name
            ? h(
                "h3",
                { className: "profile-pic" },
                h(BlankImage, {
                  src: getProfilePicUrl(checkin.person_id),
                  className: "profile-pic",
                })
              )
            : null,
          h("div", { className: "checkin-info" }, [
            !stop_name
              ? h(
                  "h3",
                  { className: "name" },
                  checkin.first_name + " " + checkin.last_name
                )
              : null,
            h("h4", { className: "edited" }, checkin.created),
            h("p", "Near " + checkin.near),
            LngLatCoords(LngLatProps),
            h("h3", { className: "rating" }, ratingArr),
          ]),
        ]),
        h("p", { className: "description" }, checkin.notes),
        h(
          "a",
          {
            className: "checkin-link",
            href: "/checkin/" + checkin.checkin_id,
            target: "_blank",
          },
          [
            image,
            showImage
              ? h("div", { className: "image-details" }, [
                  h("h1", "Details"),
                  h(Icon, {
                    className: "details-image",
                    icon: "arrow-right",
                    style: { color: "white" },
                  }),
                ])
              : null,
          ]
        ),
        h("div", { className: "checkin-footer" }, [
          h("div", { className: "likes-container" }, [
            h(Icon, {
              className: "likes-icon " + (isDarkMode ? "icon-dark-mode" : ""),
              icon: "thumbs-up",
              style: { color: "white" },
            }),
            h("h3", { className: "likes" }, checkin.likes),
          ]),
          h.if(checkin?.observations)("div", { className: "observations-container" }, [
            h(Icon, {
              className:
                "observations-icon " + (isDarkMode ? "icon-dark-mode" : ""),
              icon: "camera",
              style: { color: "white" },
            }),
            h("h3", { className: "likes" }, checkin.observations?.length),
          ]),
          h("div", { className: "comments-container" }, [
            h(Icon, {
              className:
                "comments-icon " + (isDarkMode ? "icon-dark-mode" : ""),
              icon: "comment",
              style: { color: "white" },
            }),
            h("h3", { className: "comments" }, checkin.comments),
          ]),
        ]),
      ]
    );

    return temp

}

export function Comments({comments}) {
   const commentArr = [];

    comments.forEach((item, index) => {
        const { created, comment, person_id, name, likes } = item;

        const commentNode = h('div.comment', [
            h('div.comment-author', [
                h(BlankImage, {
                    className: 'comment-pic',
                    src: getProfilePicUrl(person_id),
                    alt: "profile picture"
                }),
                h('p', { className: 'comment-author' }, name),
            ]),
            h('p', { className: 'comment-text' }, comment),
            h('p', { className: 'comment-date' }, created),
            h('div.comment-likes', [
                h(Icon, { icon: 'thumbs-up', className: 'like-icon' }),
                h('p', { className: 'comment-likes' }, String(likes)),
            ])
        ]);

        commentArr.push(commentNode);

        // Add divider between comments (but not after the last one)
        if (index < comments.length - 1) {
            commentArr.push(h(Divider));
        }
    });

    return h('div.comments', [
        ...commentArr
    ]);
}