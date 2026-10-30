/**
 * A checkin summary card with no map attached. The map pages' sidebar card,
 * which flies the map to the checkin instead, is `./map-checkin-card`.
 *
 * The published `RockdWebsiteCheckinList` in `@macrostrat/data-components` is
 * the same content, but built around a map: it calls `map.flyTo` on click and
 * appends marker elements to the map on hover, so it can't render in a
 * list-only view. This is the map-free shape, kept local while it settles —
 * it's the candidate to promote back into the library (converging with that
 * component and `CheckinListing`, which already carries a TODO to dedupe).
 */
import { type ReactNode, useState } from "react";
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

/**
 * A checkin's `photo` id can point at a file that isn't there. On error the
 * element **keeps its reserved box** rather than collapsing: the masonry
 * measures each card once and freezes its column, so an image that disappears
 * afterwards leaves the layout balanced against a height the card no longer
 * has. An empty placeholder is the honest, stable option — the box was already
 * reserved by `aspect-ratio` before the request resolved either way.
 *
 * (Contrast `BlankImage` elsewhere in the app, which hides on error. That's
 * right in a flow layout, where collapsing is free.)
 */
function ReservedImage(props: {
  src: string;
  className: string;
  alt: string;
}) {
  const { src, className, alt } = props;
  const [failed, setFailed] = useState(false);

  if (failed) {
    return h("div", { className, role: "presentation" });
  }

  return h("img", {
    src,
    className,
    alt,
    loading: "lazy",
    onError: () => setFailed(true),
  });
}

/** A count with its icon, as a card's footer shows likes and comments */
export function Stat({ icon, value }: { icon: any; value: number | string }) {
  return h("div.stat", [
    h(Icon, { icon, size: 12 }),
    h("span.stat-value", String(value ?? 0)),
  ]);
}

/** Who posted something and when: their gravatar, name and date, with
 * anything else for the row (a checkin's rating) at its end. Heads the
 * checkin cards and trip cards. */
export function PersonByline({
  personId,
  name,
  date,
  children,
}: {
  personId: number;
  name: string;
  date: string;
  children?: ReactNode;
}) {
  return h("div.checkin-header", [
    h(ReservedImage, {
      className: "profile-pic",
      src: getProfilePicUrl(personId),
      alt: "",
    }),
    h("div.checkin-byline", [
      h("span.person-name", name),
      h("span.checkin-date", date),
    ]),
    children,
  ]);
}

/** The card as a link to the checkin's own page (the `/dev/feed` lists). */
function CheckinCardContent({ data }: ItemComponentProps<Checkin>) {
  return h(
    "a.checkin-card-content",
    { href: `/checkin/${data.checkin_id}` },
    checkinSummary(data)
  );
}

export const CheckinCard = createDataCard<Checkin>(CheckinCardContent, {
  className: styles["checkin-card"],
});

/** A checkin's summary — byline, notes, photo, place and stats — for a card
 * to wrap. Shared by the link card here and the map pages' card
 * (`./map-checkin-card`), which differ only in what a click does. */
export function checkinSummary(data: Checkin) {
  const {
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
    image = h(ReservedImage, {
      className: "checkin-photo",
      src: getImageUrl(person_id, photo),
      alt: notes ?? "Checkin photo",
    });
  }

  let observationCount = null;
  if (Array.isArray(observations)) {
    observationCount = h(Stat, { icon: "camera", value: observations.length });
  }

  return [
    h(
      PersonByline,
      {
        personId: person_id,
        name: `${first_name} ${last_name}`,
        date: created,
      },
      h(Rating, { value: rating })
    ),
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
  ];
}
