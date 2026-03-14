import h from "./main.module.sass";
import { useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@macrostrat/map-interface/dist/map-interface.css";
import {
  BlankImage,
  getProfilePicUrl,
  Image,
  Comments,
  RockdSiteIcon,
} from "~/components";
import "@macrostrat/style-system";
import { rockdApiURL, SETTINGS } from "~/settings";
import { DarkModeButton, useDarkMode } from "@macrostrat/ui-components";
import {
  Button,
  ButtonGroup,
  Divider,
  Icon,
  Overlay2,
  Spinner,
} from "@blueprintjs/core";
import { MapView, PanelCard } from "@macrostrat/map-interface";
import { MapboxMapProvider, useMapRef } from "@macrostrat/mapbox-react";
import { createCheckins } from "~/components/checkin.client";

export function Trips({ data, commentsData }) {
  const [showSatellite, setShowSatellite] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const style = useMapStyle({ showSatellite });

  // format date
  const trip = data.trip_id;
  let date = new Date(data.updated);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  data.updated = date.toLocaleDateString("en-US", options);

  const toolbar = h(Toolbar, {
    showSatellite,
    setShowSatellite,
  });
  const sidebar = h(Sidebar, { data, commentsData, mapLoaded });

  if (!sidebar) {
    return h("div", { className: "loading" }, [h("h1", "Loading trip...")]);
  }

  let start = [data.stops[0].checkin.lng, data.stops[0].checkin.lat];
  const newMapPosition = {
    camera: {
      lat: start[1],
      lng: start[0],
      altitude: 300000,
    },
  };

  return h(MapboxMapProvider, [
    h("div.trips-page", [
      h("div.map-area", [
        h(MapView, {
          className: "map-view",
          style: style,
          mapboxToken: SETTINGS.mapboxAccessToken,
          mapPosition: newMapPosition,
          onMapLoaded: () => {
            setMapLoaded(true);
          },
        }),
        toolbar,
      ]),
      h("div.sidebar-area", [sidebar]),
    ]),
  ]);
}

function Toolbar({ showSatellite, setShowSatellite }) {
  const [showSettings, setSettings] = useState(false);

  return h(PanelCard, { className: "toolbar" }, [
    h("div.toolbar-header", [
      h(RockdSiteIcon, { className: "site-icon" }),
      h(Button, {
        className: "settings-icon",
        icon: "settings",
        minimal: true,
        onClick: () => {
          setSettings(!showSettings);
        },
      }),
    ]),
    h("div", { className: showSettings ? "settings-content" : "hide" }, [
      h(Divider, { className: "divider" }),
      h("div", { className: "settings" }, [
        h(ButtonGroup, { vertical: true }, [
          h(DarkModeButton, { className: "dark-btn", showText: true }),
          h(
            Button,
            {
              onClick: () => {
                setShowSatellite(!showSatellite);
              },
              icon: "satellite",
            },
            "Satellite"
          ),
        ]),
      ]),
    ]),
  ]);
}

function useMapStyle({ showSatellite }) {
  return showSatellite
    ? SETTINGS.satelliteMapURL
    : useDarkMode()?.isEnabled
    ? SETTINGS.darkMapURL
    : SETTINGS.whiteMapURL;
}

function Sidebar({ data, commentsData, mapLoaded }) {
  const mapRef = useMapRef();
  const map = mapRef.current;
  const profile_pic = h(BlankImage, {
    src: getProfilePicUrl(data.person_id),
    className: "profile-pic-header",
  });
  const stops = data.stops;
  const [commentsOpen, setCommentsOpen] = useState(false);

  if (!mapLoaded)
    return h("div", { className: "stop-container loading2" }, [
      h("h1", "Loading trip " + data.trip_id + "..."),
      h(Spinner, { style: { marginTop: "30px" } }),
    ]);

  let arr = [];
  let lats = [];
  let lngs = [];
  stops.forEach((stop, index) => {
    let temp = stop.checkin;
    temp.name = stop.name;
    arr.push(stop.checkin);

    const count = index + 1;
    const el = document.createElement("div");
    el.style.backgroundImage =
      'url("https://storage.macrostrat.org/assets/rockd/marker_red.png")';
    el.style.width = "60px";
    el.style.height = "60px";
    el.style.backgroundSize = "50%";
    el.style.display = "block";
    el.style.border = "none";
    el.style.cursor = "pointer";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundPosition = "center";

    const number = document.createElement("span");
    number.innerText = count;
    number.style.position = "absolute";
    number.style.top = "45%";
    number.style.left = "49%";
    number.style.transform = "translate(-50%, -50%)";
    number.style.color = "white";
    number.style.fontSize = "12px";
    number.style.fontWeight = "bold";

    // Append the number to the marker
    el.appendChild(number);

    // Create marker
    new mapboxgl.Marker(el)
      .setLngLat([stop.checkin.lng, stop.checkin.lat])
      .addTo(map);

    el.addEventListener("click", () => {
      map.flyTo({
        center: [stop.checkin.lng, stop.checkin.lat],
        zoom: 12,
      });
    });

    // add to array
    lats.push(stop.checkin.lat);
    lngs.push(stop.checkin.lng);
  });

  const bounds = [
    [Math.max(...lngs), Math.max(...lats)],
    [Math.min(...lngs), Math.min(...lats)],
  ];

  map.fitBounds(bounds, {
    padding: {
      top: 20,
      bottom: 20,
      left: 200,
      right: 20,
    },
    animate: false,
  });
  const stopCheckins = createCheckins(arr, mapRef, null);

  return h("div", { className: "stop-container" }, [
    h("div", { className: "top" }, [
      h("div", { className: "trip-header" }, [
        profile_pic,
        h("div", { className: "stop-info" }, [
          h(
            "h3",
            { className: "name" },
            data.first_name + " " + data.last_name
          ),
          h("h4", { className: "edited" }, "Edited " + data.updated),
        ]),
        h("div", { className: "download-button" }, [
          h(
            "a",
            {
              className: "kmz",
              href: rockdApiURL + "/trips/" + data.trip_id + "?format=kmz",
            },
            "DOWNLOAD KMZ"
          ),
        ]),
      ]),
      h("div.details", [
        h("h1", { className: "park" }, data.name),
        h("p", { className: "description" }, data.description),
        h.if(commentsData?.length > 0)(
          "div",
          {
            className: "download-button",
            onClick: () => setCommentsOpen(true),
          },
          [h("div", { className: "kmz" }, "View comments")]
        ),
        h.if(commentsData?.length > 0)(
          Overlay2,
          { className: "overlay", isOpen: commentsOpen, usePortal: true },
          [
            h("div", { className: "overlay-content" }, [
              h("div.comments-container", [
                h("div.comments-header", [
                  h("h2", { className: "comments-title" }, "Comments"),
                  h(Icon, {
                    icon: "cross",
                    className: "close-icon",
                    onClick: () => {
                      setCommentsOpen(false);
                    },
                    style: { cursor: "pointer", color: "red" },
                  }),
                ]),
                h(Divider),
                h(Comments, { comments: commentsData }),
              ]),
            ]),
          ]
        ),
      ]),
    ]),
    h("div", { className: "stop-bottom" }, [
      h("div", { className: "stop-list" }, stopCheckins),
    ]),
  ]);
}
