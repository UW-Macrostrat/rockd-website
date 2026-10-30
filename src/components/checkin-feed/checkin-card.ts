/**
 * A checkin summary card with no map attached. The map pages' sidebar card,
 * which flies the map to the checkin instead, is `./map-checkin-card`. Its
 * pieces (byline, rating, photo box, footer) are `./checkin-card-parts`.
 *
 * The published `RockdWebsiteCheckinList` in `@macrostrat/data-components` is
 * the same content, but built around a map: it calls `map.flyTo` on click and
 * appends marker elements to the map on hover, so it can't render in a
 * list-only view. This is the map-free shape, kept local while it settles —
 * it's the candidate to promote back into the library (converging with that
 * component and `CheckinListing`, which already carries a TODO to dedupe).
 */
import { createDataCard, type ItemComponentProps } from "@macrostrat/data-sheet";
import { getImageUrl } from "~/components";
import hyper from "@macrostrat/hyper";
import styles from "./checkin-card.module.sass";
import type { Checkin } from "./checkin-provider";
import {
  CheckinFooter,
  PersonByline,
  Rating,
  ReservedImage,
} from "./checkin-card-parts";

export * from "./checkin-card-parts";

const h = hyper.styled(styles);

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
  const { person_id, first_name, last_name, photo, notes, created, rating } =
    data;

  let image = null;
  if (photo != null) {
    image = h(ReservedImage, {
      className: "checkin-photo",
      src: getImageUrl(person_id, photo),
      alt: notes ?? "Checkin photo",
    });
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
    h(CheckinFooter, { data }),
  ];
}
