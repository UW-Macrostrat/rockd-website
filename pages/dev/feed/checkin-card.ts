/**
 * A checkin summary card with no map attached.
 *
 * The published `RockdWebsiteCheckinList` in `@macrostrat/data-components` is
 * the same content, but built around a map: it calls `map.flyTo` on click and
 * appends marker elements to the map on hover, so it can't render in a
 * list-only view. This is the map-free shape, kept local while it settles —
 * it's the candidate to promote back into the library (converging with that
 * component and `CheckinListing`, which already carries a TODO to dedupe).
 */
import { type MouseEvent, useState } from "react";
import { Icon } from "@blueprintjs/core";
import { LngLatCoords } from "@macrostrat/data-components";
import { createDataCard, type ItemComponentProps } from "@macrostrat/data-sheet";
import { getImageUrl, getProfilePicUrl } from "~/components";
import hyper from "@macrostrat/hyper";
import styles from "./checkin-card.module.sass";
import type { Checkin } from "./checkin-provider";

const h = hyper.styled(styles);

const MAX_RATING = 5;

function Rating({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(MAX_RATING, value ?? 0));
  const stars = Array.from({ length: MAX_RATING }, (_, i) => {
    let icon = "star-empty";
    if (i < filled) icon = "star";
    return h(Icon, { key: i, className: "star", icon, size: 12 });
  });
  return h("div.rating", { title: `${filled} of ${MAX_RATING}` }, stars);
}

/** A checkin's `photo` id can point at a file that isn't there, and a broken
 * `<img>` still occupies a box. Collapse on error, as `BlankImage` does
 * elsewhere in the app. */
function SelfHidingImage(props: {
  src: string;
  className: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return h("img", {
    ...props,
    loading: "lazy",
    onError: () => setFailed(true),
  });
}

function Stat({ icon, value }: { icon: any; value: number | string }) {
  return h("div.stat", [
    h(Icon, { icon, size: 12 }),
    h("span.stat-value", String(value ?? 0)),
  ]);
}

function CheckinCardContent({ data }: ItemComponentProps<Checkin>) {
  const {
    checkin_id,
    person_id,
    first_name,
    last_name,
    photo,
    notes,
    near,
    created,
    rating,
    likes,
    comments,
    observations,
  } = data;

  let image = null;
  if (photo != null) {
    image = h(SelfHidingImage, {
      className: "checkin-photo",
      src: getImageUrl(person_id, photo),
      alt: notes ?? "Checkin photo",
    });
  }

  let observationCount = null;
  if (Array.isArray(observations)) {
    observationCount = h(Stat, { icon: "camera", value: observations.length });
  }

  // Cmd/ctrl-click enters select mode (the panel handles that itself); all the
  // card owes it is not navigating, since a cmd-click on a link opens a tab.
  const onClick = (event: MouseEvent) => {
    if (!(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
  };

  return h(
    "a.checkin-card-content",
    { href: `/checkin/${checkin_id}`, onClick },
    [
      h("div.checkin-header", [
        h(SelfHidingImage, {
          className: "profile-pic",
          src: getProfilePicUrl(person_id),
          alt: "",
        }),
        h("div.checkin-byline", [
          h("span.person-name", `${first_name} ${last_name}`),
          h("span.checkin-date", created),
        ]),
        h(Rating, { value: rating }),
      ]),
      h.if(notes != null && notes !== "")("p.checkin-notes", notes),
      image,
      h("div.checkin-footer", [
        h("div.checkin-place", [
          h.if(near != null)("span.near", `Near ${near}`),
          h(LngLatCoords, {
            position: { lat: data.lat, lng: data.lng },
            precision: 3,
            zoom: 10,
          }),
        ]),
        h("div.checkin-stats", [
          h(Stat, { icon: "thumbs-up", value: likes }),
          observationCount,
          h(Stat, { icon: "comment", value: comments }),
        ]),
      ]),
    ]
  );
}

export const CheckinCard = createDataCard<Checkin>(CheckinCardContent, {
  className: styles["checkin-card"],
});
