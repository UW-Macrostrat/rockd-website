import { LngLatCoords } from "@macrostrat/map-interface";
import { useState, useEffect } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  BlankImage,
  getImageUrl,
  TestImage,
  Footer,
} from "~/components/general";
import { Icon } from "@blueprintjs/core";
import h from "./main.module.sass";
import "@macrostrat/style-system";
import { LithologyList } from "@macrostrat/data-components";
import { useDarkMode } from "@macrostrat/ui-components";
import { usePageContext } from "vike-react/usePageContext";
import { useData } from "vike-react/useData";
import { macrostratApiURL } from "@macrostrat-web/settings";

export function Page() {
    const { checkin } = useData();
    const isDarkMode = useDarkMode()?.isEnabled;
    const pageContext = usePageContext();
    const photoID = parseInt(pageContext.urlPathname
        .split("/")[2]
        .replace(/%40/g, "@")
        .replace(/%2B/g, "+"));


  const TestObject = PhotoIDCollector({ checkin })
  const photoIDArr = TestObject.props.photoIDArr.sort((a, b) => a - b);

  const photoIndex = photoIDArr.indexOf(photoID);

  return h("div", { className: "page-container" }, [
    h("div.photo-banner", 
        h("a", { href: "/checkin/" + checkin.checkin_id, className: "back-checkin" }, [
            h(Icon, {
                icon: "arrow-left",
                className: "back-checkin-arrow",
                style: { color: isDarkMode ? "black" : "white" },
            }),
            h("h3", "Checkin #" + checkin.checkin_id),
        ]),
    ),
    h("div", { className: "photos" }, [
        h.if(photoIndex !== 0)("a", { href: "/photo/" + photoIDArr[photoIndex - 1] }, h(Icon, {
            className: "left-arrow",
            icon: "arrow-left",
            style: { color: isDarkMode ? "black" : "white" },
        })),
        h(Item, {
            checkin,
            photoID,
        }),
        h.if(photoIndex !== photoIDArr.length - 1)("a", { href: "/photo/" + photoIDArr[photoIndex + 1] }, h(Icon, {
            className: "right-arrow",
            icon: "arrow-right",
            style: { color: isDarkMode ? "black" : "white" },
        }))
    ]), h("div.circles", photoIDArr.map((photo) => {
        if (photo == photoID) {
            return h("div", h(Icon, { icon: "symbol-circle", style: { color: "grey" } }));
        } else {
            return h("a", { href: "/photo/" + photo }, [
                h(Icon, { icon: "symbol-circle", style: { color: "white" } }),
            ]);
        }
    })), 
    h('div.hide', TestObject),
    h(Footer)
  ]);
}

function ObservationContent({ observation, setBody }) {
  const rocks = observation.rocks;

  function rgbaStringToHex(rgba) {
    const values = rgba.split(",").map((v) => v.trim());
    const [r, g, b] = values.map((v) => parseInt(v, 10));
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

    let lithologies = [];
    rocks.liths?.forEach(lith => {
        if(!lith.color.includes("#")) {
            lithologies.push({
                ...lith,
                color: rgbaStringToHex(lith.color),
            });
        } else {
            lithologies.push(lith);
        }
    });

    if(rocks.interval?.name) {
        lithologies.push({
            name: rocks.interval.name,
            int_id: rocks.interval.int_id,
            color: `rgba(${rocks.interval.color})`,
        })
    }

    if (rocks.strat_name?.strat_name_long) {
        lithologies.push({
            name: rocks.strat_name?.strat_name_long,
            strat_id: rocks.strat_name?.strat_name_id
        })
    }

    if(rocks.map_unit?.unit_name) {
        lithologies.push({
            name: rocks.map_unit?.unit_name
        })
    }
    
    if(observation.orientation.feature?.name) {
        lithologies.push({
            name: observation.orientation.feature?.name
        })
    }

  const LngLatProps = {
    position: {
      lat: observation.lat,
      lng: observation.lng,
    },
    precision: 3,
    zoom: 10,
  };

  const show = lithologies.length > 0 || rocks?.notes?.length > 0 && observation.lat && rocks.strat_name?.strat_name_long

  const handleClick = (e, data) => {
      if (data.int_id) {
          window.open(macrostratApiURL + `/lex/intervals/${data.int_id}`, '_blank');
      }
      if (data.strat_id) {
          window.open(macrostratApiURL + `/lex/strat-names/${data.strat_id}`, '_blank');
      }
      if (data.lith_id) {
          window.open(macrostratApiURL + `/lex/lithology/${data.lith_id}`, '_blank');
      }
  };

  return h.if(show)("div", { className: "observation-body" }, [
    h(Icon, {
      className: "close-body",
      icon: "ban-circle",
      onClick: () => setBody(false),
    }),
    observation.lat && rocks.strat_name?.strat_name_long
      ? h("h4", { className: "observation-header" }, [
          rocks.strat_name.strat_name_long,
          LngLatCoords(LngLatProps),
        ])
      : null,
    h.if(lithologies || rocks)("div", { className: "observation-details" }, [
      h(LithologyList, { lithologies, onClickItem: handleClick}),
      h("p", { className: "notes" }, rocks.notes),
    ]),
  ]);
}

function Item({ checkin, photoID }) {
  const [showBody, setBody] = useState(true);
  
    const observation = checkin.observations.find(
        (obs) => obs.photo === photoID
    );
    const isObservation = observation !== undefined;
    const imageSrc = getImageUrl(checkin.person_id, isObservation ? observation.photo : checkin.photo);
    const bodyContent = isObservation
        ? h(ObservationContent, { observation, setBody, showBody })
        : h("div", { className: "observation-body" }, [
            h(Icon, {
              className: "close-body",
              icon: "ban-circle",
              onClick: () => setBody(false),
            }),
            h('div.notes', checkin.notes ?? "No notes available"),
        ]);

  return h("div", { className: "observation-item" }, [
    h(BlankImage, { className: "observation-image", src: imageSrc }),
    showBody ? bodyContent : null,
    h.if(!showBody)(Icon, {
        className: "info-btn",
        icon: "info-sign",
        onClick: () => setBody(true),
    })
  ]);
}

function PhotoIDCollector({ checkin }) {
  const [photoIDArr, setPhotoIDArr] = useState(() =>
    checkin.photo ? [checkin.photo] : []
  );
  const [testedPhotos, setTestedPhotos] = useState(() => {
    return checkin.observations
      ? checkin.observations.map(obs => obs.photo).filter(Boolean)
      : [];
  });

  useEffect(() => {
    // Only update if checkin changes
    if (checkin.photo && !photoIDArr.includes(checkin.photo)) {
      setPhotoIDArr(prev => [...prev, checkin.photo]);
    }

    const newPhotos = (checkin.observations || [])
      .map(obs => obs.photo)
      .filter(photo => photo && !testedPhotos.includes(photo));

    if (newPhotos.length > 0) {
      setTestedPhotos(prev => [...prev, ...newPhotos]);
    }
  }, [checkin]);

  return h('div', { photoIDArr }, [
    ...testedPhotos.map((photo) => {
      return h(HideImage, {
        key: photo,
        checkin,
        photo,
        setPhotoIDArr,
      });
    })
  ]);
}


function HideImage({ checkin, photo, setPhotoIDArr }) {
  return h(TestImage, {
    key: photo,
    src: getImageUrl(checkin.person_id, photo),
    onLoad: () => {
      setPhotoIDArr((prev) => (prev.includes(photo) ? prev : [...prev, photo]));
    },
    onError: () => console.warn("Image failed to load:", photo),
  });
}