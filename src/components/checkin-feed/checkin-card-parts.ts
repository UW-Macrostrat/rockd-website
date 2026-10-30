/**
 * The checkin cards' pieces — byline, rating, photo box, counts and footer —
 * apart from the cards themselves (`./checkin-card`), so a page can compose
 * them without the cards' `@macrostrat/data-sheet` wrapper (the checkin page,
 * which also renders on the server; the trip cards).
 */
import { type ReactNode, useState } from "react";
import { Icon } from "@blueprintjs/core";
import { LngLatCoords } from "@macrostrat/data-components";
import { getProfilePicUrl } from "~/components";
import hyper from "@macrostrat/hyper";
import styles from "./checkin-card.module.sass";
import type { Checkin } from "./checkin-provider";

const h = hyper.styled(styles);

const MAX_RATING = 5;

/** A checkin's 0–5 star rating */
export function Rating({ value }: { value: number }) {
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
export function ReservedImage(props: {
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

/** A checkin's place and coordinates, and its like, observation and comment
 * counts: the cards' footer, and the checkin page's. */
export function CheckinFooter({ data }: { data: Checkin }) {
  const { near, likes, comments, observations } = data;

  let observationCount = null;
  if (Array.isArray(observations)) {
    observationCount = h(Stat, { icon: "camera", value: observations.length });
  }

  return h("div.checkin-footer", [
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
  ]);
}
