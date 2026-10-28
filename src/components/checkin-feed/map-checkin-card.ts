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
import styles from "./checkin-card.module.sass";
import { checkinSummary } from "./checkin-card";
import type { Checkin } from "./checkin-provider";

const h = hyper.styled(styles);

function MapCheckinCardContent({ data }: ItemComponentProps<Checkin>) {
  const mapRef = useMapRef();

  function showOnMap() {
    mapRef.current?.flyTo({ center: [data.lng, data.lat], zoom: 12 });
  }

  return h(
    "div.checkin-card-content.map-checkin",
    {
      role: "button",
      tabIndex: 0,
      onClick: showOnMap,
      onKeyDown: (e) => {
        if (e.key === "Enter") showOnMap();
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
    ]
  );
}

export const MapCheckinCard = createDataCard<Checkin>(MapCheckinCardContent, {
  className: styles["checkin-card"],
});
