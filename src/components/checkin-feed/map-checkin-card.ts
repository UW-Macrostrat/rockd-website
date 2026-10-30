/**
 * The checkin card for a map page's sidebar: the same summary as the feed's
 * `CheckinCard`, but a click flies the map to the checkin (as the map pages'
 * lists always have), with the checkin's own page behind a "Details" link.
 * Needs the map context `MapAreaContainer` provides.
 */
import { Icon } from "@blueprintjs/core";
import { createDataCard, type ItemComponentProps } from "@macrostrat/data-sheet";
import { useMapRef } from "@macrostrat/mapbox-react";
import hyper from "@macrostrat/hyper";
import type { ReactNode } from "react";
import styles from "./checkin-card.module.sass";
import { checkinSummary } from "./checkin-card";
import type { Checkin } from "./checkin-provider";

const h = hyper.styled(styles);

export interface MapCheckinCardBodyProps {
  data: Checkin;
  /** What a click does; flies the map to the checkin by default */
  onActivate?: () => void;
  className?: string;
  /** Laid over the card, e.g. a status badge */
  children?: ReactNode;
}

/** The map card's content, for a page's own card that changes what a click
 * does or adds overlays (StraboSpot's selection and "sent" badge). */
export function MapCheckinCardBody({
  data,
  onActivate,
  className,
  children,
}: MapCheckinCardBodyProps) {
  const mapRef = useMapRef();

  function showOnMap() {
    mapRef.current?.flyTo({ center: [data.lng, data.lat], zoom: 12 });
  }
  const activate = onActivate ?? showOnMap;

  return h(
    "div.checkin-card-content.map-checkin",
    {
      className,
      role: "button",
      tabIndex: 0,
      onClick: activate,
      onKeyDown: (e) => {
        if (e.key === "Enter") activate();
      },
    },
    [
      checkinSummary(data),
      // A new tab, so the map keeps its place
      h(
        "a.checkin-details",
        {
          href: `/checkin/${data.checkin_id}`,
          target: "_blank",
          onClick: (e) => e.stopPropagation(),
        },
        ["Details", h(Icon, { icon: "arrow-right", size: 12 })]
      ),
      children,
    ]
  );
}

function MapCheckinCardContent({ data }: ItemComponentProps<Checkin>) {
  return h(MapCheckinCardBody, { data });
}

export const MapCheckinCard = createDataCard<Checkin>(MapCheckinCardContent, {
  className: styles["checkin-card"],
});

/** Wraps a page's own card content the way the map card is wrapped. */
export function createMapCheckinCard(
  content: (props: ItemComponentProps<Checkin>) => ReactNode
) {
  return createDataCard<Checkin>(content as any, {
    className: styles["checkin-card"],
  });
}
