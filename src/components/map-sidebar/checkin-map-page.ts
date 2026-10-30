import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useRockdAPI } from "~/components";
import { MapCheckinCard } from "~/components/checkin-feed";
import h from "./map-sidebar.module.sass";
import { RockdMapPage } from "./map-page";
import { MapPointClicks, type PointTarget, SelectedPin } from "./map-points";
import { checkinTileLayers, checkinTilesStyle } from "./map-style";

export interface CheckinMapPageProps {
  /** The sidebar's title and body until a checkin is picked on the map */
  title: string;
  list: ReactNode;
  /** Shows only this person's checkins on the map */
  personId?: number;
  /** Page-specific controls in the sidebar header */
  tools?: ReactNode;
  /** Adds Logout to Settings */
  onLogout?: () => void;
}

interface PickedCheckin {
  id: number;
  position: [number, number];
}

/**
 * A map of checkins (Explore, My checkins, StraboSpot): the Rockd API's
 * clustered checkin tiles, with the page's list in the sidebar. A checkin
 * picked on the map gets a blue pin and replaces the list ("Selected
 * checkins") until it's closed or the map is clicked elsewhere.
 */
export function CheckinMapPage({
  title,
  list,
  personId,
  tools,
  onLogout,
}: CheckinMapPageProps) {
  const [picked, setPicked] = useState<PickedCheckin | null>(null);
  const layers = useMemo(() => checkinTilesStyle(personId), [personId]);

  let route: string | null = null;
  if (picked != null) route = `/protected/checkins?checkin_id=${picked.id}`;
  const checkins = useRockdAPI(route)?.success?.data;

  const clearPick = useCallback(() => setPicked(null), []);
  const targets: PointTarget[] = useMemo(
    () => [
      {
        layers: checkinTileLayers,
        onPick: (feature) =>
          setPicked({
            id: Number(feature.properties.id),
            position: (feature.geometry as GeoJSON.Point).coordinates as [
              number,
              number,
            ],
          }),
      },
    ],
    []
  );

  let sidebarTitle = title;
  let sidebar = list;
  let onClose: (() => void) | undefined;
  if (picked != null && checkins != null) {
    sidebarTitle = "Selected checkins";
    onClose = clearPick;
    sidebar = h(
      "div.selected-checkins",
      checkins.map((checkin) =>
        h(MapCheckinCard, { key: checkin.checkin_id, data: checkin })
      )
    );
  }

  return h(
    RockdMapPage,
    { title: sidebarTitle, sidebar, onClose, tools, onLogout, layers },
    [
      h(MapPointClicks, { targets, onMiss: clearPick }),
      h(SelectedPin, { position: picked?.position }),
    ]
  );
}
