import { useState } from "react";
import h from "./checkin.client.module.sass";
import { BlankImage, getImageUrl, getProfilePicUrl, TestImage } from "~/components/index";
import { useDarkMode } from "@macrostrat/ui-components";
import { LngLatCoords } from "@macrostrat/data-components";
import { Icon } from "@blueprintjs/core";
import mapboxgl from "mapbox-gl";

export function Checkin({ checkin, mapRef, setInspectPosition, len }) {
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
    image = h("div.no-image", [
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
    "div.checkin",
    {
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
      h("div.hide", test),
      h("h1.stop-name", stop_name),
      h("div.checkin-header", [
        !stop_name
          ? h(
            "h3.profile-pic",
            h(BlankImage, {
              src: getProfilePicUrl(checkin.person_id),
              className: "profile-pic",
            })
          )
          : null,
        h("div.checkin-info", [
          !stop_name
            ? h(
              "h3.name",
              checkin.first_name + " " + checkin.last_name
            )
            : null,
          h("h4.edited", checkin.created),
          h("p", "Near " + checkin.near),
          LngLatCoords(LngLatProps),
          h("h3.rating", ratingArr),
        ]),
        checkin.spot_id != null &&
        h(
          "a.strabo-link",
          {
            href: "https://strabospot.org",
            target: "_blank",
            rel: "noopener noreferrer",
          },
          "via StraboSpot"
        ),
      ]),
      h("p.description", checkin.notes),
      h(
        "a.checkin-link",
        {
          href: "/checkin/" + checkin.checkin_id,
          target: "_blank",
        },
        [
          image,
          showImage
            ? h("div.image-details", [
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
      h("div.checkin-footer", [
        h("div.likes-container", [
          h(Icon, {
            className: "likes-icon " + (isDarkMode ? "icon-dark-mode" : ""),
            icon: "thumbs-up",
            style: { color: "white" },
          }),
          h("h3.likes", checkin.likes),
        ]),
        h.if(checkin?.observations)(
          "div.observations-container",
          [
            h(Icon, {
              className:
                "observations-icon " + (isDarkMode ? "icon-dark-mode" : ""),
              icon: "camera",
              style: { color: "white" },
            }),
            h("h3.likes", checkin.observations?.length),
          ]
        ),
        h("div.comments-container", [
          h(Icon, {
            className: "comments-icon " + (isDarkMode ? "icon-dark-mode" : ""),
            icon: "comment",
            style: { color: "white" },
          }),
          h("h3.comments", checkin.comments),
        ]),
      ]),
    ]
  );

  return temp;
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
