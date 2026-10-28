/**
 * The checkin list for a map page's sidebar: the shared `CheckinFeedPanel` in
 * one column, with cards that show their checkin on the map. Needs the map
 * context `MapAreaContainer` provides.
 */
import { Spinner } from "@blueprintjs/core";
import { createMasonryScrollBody } from "@macrostrat/data-sheet";
import { useMap } from "@macrostrat/mapbox-react";
import type { LngLatBounds } from "mapbox-gl";
import { useEffect, useState } from "react";
import { CheckinFeedPanel, type CheckinFeedPanelProps } from "./feed-panel";
import type { CheckinBounds, FeedContext } from "./checkin-provider";
import { MapCheckinCard } from "./map-checkin-card";
import h from "./feed-panel.module.sass";

// A masonry still, for its measured, append-only layout: a card's photo
// reserves its box before it loads, so paging never moves what's on screen
const SingleColumn = createMasonryScrollBody({ columns: 1 });

export interface MapCheckinFeedProps {
  feed: FeedContext;
  /** Lists only the checkins in the map's visible area, following the map as
   * it moves */
  followMap?: boolean;
  /** A page's own card (see `createMapCheckinCard`); the map card by default */
  itemComponent?: CheckinFeedPanelProps["itemComponent"];
}

export function MapCheckinFeed({
  feed,
  followMap = false,
  itemComponent = MapCheckinCard,
}: MapCheckinFeedProps) {
  const bounds = useMapBounds(followMap);

  // Until the map has a view there's no region to list, and the unbounded
  // feed would only be replaced a moment later
  if (followMap && bounds == null) {
    return h(Spinner, { className: "feed-spinner" });
  }

  let context = feed;
  if (followMap) {
    context = { ...feed, bounds };
  }

  return h(CheckinFeedPanel, {
    feed: context,
    itemComponent,
    scrollBody: SingleColumn,
    className: "map-feed",
  });
}

/** The map's visible area, updated when a move ends (not on every frame of
 * one, which would restart the list mid-pan). */
function useMapBounds(enabled: boolean): CheckinBounds | null {
  const map = useMap();
  const [bounds, setBounds] = useState<CheckinBounds | null>(null);

  useEffect(() => {
    if (!enabled || map == null) return;

    const update = () => setBounds(toCheckinBounds(map.getBounds()));
    if (map.loaded()) {
      update();
    } else {
      map.once("load", update);
    }
    map.on("moveend", update);
    return () => {
      map.off("moveend", update);
      map.off("load", update);
    };
  }, [map, enabled]);

  return bounds;
}

function toCheckinBounds(bounds: LngLatBounds | null): CheckinBounds | null {
  if (bounds == null) return null;
  return {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast(),
  };
}
