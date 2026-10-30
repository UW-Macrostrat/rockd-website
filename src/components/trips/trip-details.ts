import { AnchorButton, Button, Card } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { type RefObject, useEffect, useRef } from "react";
import { Comments } from "~/components";
import { MapCheckinCard } from "~/components/checkin-feed";
import { rockdApiURL } from "~/settings";
import styles from "./trip-details.module.sass";

const h = hyper.styled(styles);

export interface TripDetailsProps {
  trip: any;
  /** The stop picked on the map, scrolled to and outlined */
  selectedStopId: number | null;
  /** The trip's comments; a "Comments" button opens them */
  comments?: any[];
  onShowComments?: () => void;
}

/**
 * A trip in a map page's sidebar: its header card, then its stops as the map
 * pages' checkin cards, each under its stop's name.
 */
export function TripDetails({
  trip,
  selectedStopId,
  comments,
  onShowComments,
}: TripDetailsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useScrollToTop(rootRef, trip.trip_id);
  useScrollToStop(listRef, selectedStopId);

  const stops = trip.stops.map((stop, index) => {
    const checkinId = stop.checkin.checkin_id;
    let className: string | undefined;
    if (checkinId === selectedStopId) className = "selected";

    return h(
      "div.stop",
      { key: checkinId ?? index, className, "data-checkin-id": checkinId },
      [
        h("h4.stop-name", stop.name),
        h(MapCheckinCard, { data: stop.checkin }),
      ]
    );
  });

  return h("div.trip-details", { ref: rootRef }, [
    h(TripHeader, { trip, comments, onShowComments }),
    h("div.stop-list", { ref: listRef }, stops),
  ]);
}

/** The trip's name, edited date and stop count, description, and its KMZ
 * download and comments, as one card over the stops. */
function TripHeader({ trip, comments, onShowComments }) {
  const stopCount = trip.stops.length;
  let stopLabel = `${stopCount} stops`;
  if (stopCount === 1) stopLabel = "1 stop";

  return h(Card, { className: "trip-header" }, [
    h("h2.trip-name", trip.name),
    h("p.trip-meta", `Edited ${formatTripDate(trip.updated)} · ${stopLabel}`),
    h.if(trip.description)("p.description", trip.description),
    h("div.trip-actions", [
      h(
        AnchorButton,
        {
          href: `${rockdApiURL}/trips/${trip.trip_id}?format=kmz`,
          icon: "download",
          outlined: true,
          small: true,
        },
        "Download KMZ"
      ),
      h.if(comments?.length > 0 && onShowComments != null)(
        Button,
        { icon: "comment", outlined: true, small: true, onClick: onShowComments },
        `Comments (${comments?.length})`
      ),
    ]),
  ]);
}

/** A trip's comments, in place of its details */
export function TripComments({ comments }: { comments: any[] }) {
  return h("div.trip-comments", h(Comments, { comments }));
}

/** Brings a newly shown trip's header into view */
function useScrollToTop(rootRef: RefObject<HTMLDivElement | null>, tripId) {
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "start" });
  }, [tripId]);
}

/** Scrolls the sidebar to a stop's card whenever it's picked on the map (or
 * the trip's view returns with one picked). */
function useScrollToStop(
  listRef: RefObject<HTMLDivElement | null>,
  checkinId: number | null
) {
  useEffect(() => {
    if (checkinId == null) return;
    const stop = listRef.current?.querySelector(
      `[data-checkin-id="${checkinId}"]`
    );
    stop?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [checkinId]);
}

/** A trip's date as "March 12, 2019" */
export function formatTripDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
