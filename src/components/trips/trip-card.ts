import { Card, Spinner } from "@blueprintjs/core";
import { PersonByline, Stat } from "~/components/checkin-feed";
import hyper from "@macrostrat/hyper";
import type { ReactNode } from "react";
import styles from "./trip-details.module.sass";
import { formatTripDate } from "./trip-details";

const h = hyper.styled(styles);

/** Trips as cards, under a short description and a title; a spinner while
 * `trips` is null. */
export function TripList({
  title,
  description,
  trips,
}: {
  title: string;
  description: string;
  trips: any[] | null;
}) {
  let cards: ReactNode = h(Spinner, {
    size: 30,
    className: "trip-list-spinner",
  });
  if (trips != null) {
    cards = h(
      "div.trip-cards",
      trips.map((trip) => h(TripCard, { key: trip.trip_id, trip }))
    );
  }

  return h("div.trip-list", [
    h("p.trip-list-description", description),
    h("h3.trip-list-title", title),
    cards,
  ]);
}

/** A trip at a glance: who made it and when (as the checkin cards' byline),
 * its name and description, and its stop, like and comment counts. Opens the
 * trip's page. */
export function TripCard({ trip }: { trip: any }) {
  const stopCount = trip.stops?.length ?? 0;
  let stopLabel = `${stopCount} stops`;
  if (stopCount === 1) stopLabel = "1 stop";

  return h("a.trip-card-link", { href: `/trip/${trip.trip_id}` }, [
    h(Card, { interactive: true, className: "trip-card" }, [
      h(PersonByline, {
        personId: trip.person_id,
        name: `${trip.first_name} ${trip.last_name}`,
        date: formatTripDate(trip.created),
      }),
      h("h4.trip-card-name", trip.name),
      h.if(trip.description)("p.trip-card-description", trip.description),
      h("div.trip-card-counts", [
        h(Stat, { icon: "map-marker", value: stopLabel }),
        h(Stat, { icon: "thumbs-up", value: trip.likes }),
        h(Stat, { icon: "comment", value: trip.comments }),
      ]),
    ]),
  ]);
}
