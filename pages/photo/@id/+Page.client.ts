import { LngLatCoords } from "@macrostrat/map-interface";
import { useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  BlankImage,
  imageExists,
  Image,
  getImageUrl,
} from "~/components/general";
import { Icon } from "@blueprintjs/core";
import h from "./main.module.sass";
import "@macrostrat/style-system";
import { LithologyList } from "@macrostrat/data-components";
import { DarkModeButton } from "@macrostrat/ui-components";
import { usePageContext } from "vike-react/usePageContext";
import { useData } from "vike-react/useData";

export function Page() {
  const pageContext = usePageContext();
  const photoID = pageContext.urlPathname
    .split("/")[2]
    .replace(/%40/g, "@")
    .replace(/%2B/g, "+");
  const { checkinData } = useData();
  const checkin = checkinData.success.data[0];

  let photoIDArr = [checkin.photo];

  let ratingArr = [];
  for (let i = 0; i < checkin.rating; i++) {
    ratingArr.push(
      h(Icon, {
        className: "star",
        icon: "star",
        style: { color: "white" },
      })
    );
  }
  for (let i = 0; i < 5 - checkin.rating; i++) {
    ratingArr.push(
      h(Icon, {
        className: "star",
        icon: "star-empty",
        style: { color: "white" },
      })
    );
  }

  let observations = [];

  const imageSrc = getImageUrl(checkin.person_id, checkin.photo);
  const headerImgUrl = checkin.photo && imageExists(imageSrc) ? imageSrc : null;

  const headerBody = ({ onClose }) =>
    h("div", { className: "observation-body-container" }, [
      h(Icon, {
        className: "close-body",
        icon: "ban-circle",
        onClick: onClose,
      }),
      checkin.notes,
    ]);

  observations.push(
    h(ObservationBody, {
      headerImgUrl: headerImgUrl,
      headerBody,
    })
  );

  checkin.observations.forEach((observation) => {
    if (Object.keys(observation.rocks).length !== 0) {
      if (observation.photo) {
        photoIDArr.push(observation.photo);
      }

      const imageSrc = getImageUrl(checkin.person_id, observation.photo);
      const observationURL =
        observation.photo && imageExists(imageSrc) ? imageSrc : null;

      const observationBody = ({ onClose }) =>
        h(observationFooter, { observation, onClose });

      observations.push(
        h(ObservationBody, {
          headerImgUrl: observationURL,
          headerBody: observationBody,
        })
      );
    }
  });

  const photoIndex = photoIDArr.indexOf(parseInt(photoID));
  const observation = observations[photoIndex];
  const leftArrow = h(Icon, {
    className: "left-arrow",
    icon: "arrow-left",
    style: { color: "white" },
  });
  const rightArrow = h(Icon, {
    className: "right-arrow",
    icon: "arrow-right",
    style: { color: "white" },
  });

  let footer = [];
  photoIDArr.forEach((photo) => {
    if (photo == photoID) {
      footer.push(
        h("div", h(Icon, { icon: "symbol-circle", style: { color: "grey" } }))
      );
    } else {
      footer.push(
        h("a", { href: "/photo/" + photo }, [
          h(Icon, { icon: "symbol-circle", style: { color: "white" } }),
        ])
      );
    }
  });

  return h("div", { className: "page-container" }, [
    h("div.photo-banner", [
      h("a", { href: "/checkin/" + checkin.checkin_id, className: "back-checkin" }, [
        h(Icon, {
          icon: "arrow-left",
          className: "back-checkin-arrow",
          style: { color: "white" },
        }),
        h("h3", "CHECKIN"),
      ]),
      h("div.right-side", [
        h(DarkModeButton, { className: "dark-mode-btn", showText: true }),
        h("a", { href: "/" }, [
          h(Image, { className: "home-icon", src: "favicon-32x32.png" }),
        ]),
      ]),
    ]),
    h("div", { className: "photos" }, [
      photoIndex !== 0
        ? h("a", { href: "/photo/" + photoIDArr[photoIndex - 1] }, leftArrow)
        : null,
      observation,
      photoIndex !== photoIDArr.length - 1
        ? h("a", { href: "/photo/" + photoIDArr[photoIndex + 1] }, rightArrow)
        : null,
    ]),
    h("div.circles", footer),
  ]);
}

function observationFooter({ observation, onClose }) {
  const rocks = observation.rocks;

  function rgbaStringToHex(rgba) {
    const values = rgba.split(",").map((v) => v.trim());
    const [r, g, b] = values.map((v) => parseInt(v, 10));
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  let lithologies = [];
  rocks.liths.forEach((lith) => {
    if (!lith.color.includes("#")) {
      lithologies.push({ name: lith.name, color: rgbaStringToHex(lith.color) });
    } else {
      lithologies.push(lith);
    }
  });

  if (rocks.strat_name?.strat_name_long) {
    lithologies.push({ name: rocks.strat_name.strat_name_long });
  }
  if (rocks.map_unit?.unit_name) {
    lithologies.push({ name: rocks.map_unit.unit_name });
  }
  if (observation.age_est) {
    lithologies.push({
      name: `${observation.age_est.name} (${observation.age_est.b_age} - ${observation.age_est.t_age})`,
    });
  }
  if (rocks.interval?.name) {
    lithologies.push({ name: rocks.interval.name });
  }
  if (observation.orientation.feature?.name) {
    lithologies.push({ name: observation.orientation.feature.name });
  }

  const LngLatProps = {
    position: {
      lat: observation.lat,
      lng: observation.lng,
    },
    precision: 3,
    zoom: 10,
  };

  return h("div", { className: "observation-body" }, [
    observation.lat && rocks.strat_name?.strat_name_long
      ? h("h4", { className: "observation-header" }, [
          rocks.strat_name.strat_name_long,
          LngLatCoords(LngLatProps),
        ])
      : null,
    h("div", { className: "observation-details" }, [
      h(LithologyList, { lithologies }),
      h("p", { className: "notes" }, rocks.notes),
    ]),
    h(Icon, {
      className: "close-body",
      icon: "ban-circle",
      onClick: onClose,
    }),
  ]);
}

function ObservationBody({ headerImgUrl, headerBody }) {
  const [showBody, setBody] = useState(true);

  return h("div", { className: "observation-item" }, [
    headerImgUrl
      ? h(BlankImage, { className: "observation-image", src: headerImgUrl })
      : null,
    showBody ? headerBody({ onClose: () => setBody(false) }) : null,
    !showBody
      ? h(Icon, {
          className: "info-btn",
          icon: "info-sign",
          onClick: () => setBody(true),
        })
      : null,
  ]);
}
