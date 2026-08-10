import { Spinner } from "@blueprintjs/core";
import { useState } from "react";
import h from "../explore/main.module.sass";
import { PageCarousel, fetchRockdData } from "~/components";
import { createCheckins } from "~/components/checkin.client";
import { useAsyncMemo } from "@macrostrat/ui-components";
import { useMapRef } from "@macrostrat/mapbox-react";

/**
 * The signed-in user's checkins, paged. Adapted from the StraboSpot dev page's
 * FeatureDetails without the selection mode, bulk send, or sent-badge — this
 * view is read-only.
 */
export function CheckinList({ setInspectPosition, personId }) {
  const [page, setPage] = useState(1);
  const mapRef = useMapRef();
  const [result, nextData] = useRockdCheckins(page, personId);

  if (personId == null) return null;

  if (result == null) {
    return h(Spinner, { className: "loading-spinner" });
  }

  if (result.length === 0) {
    return h("div.checkin-container", [
      h("p", "You haven't recorded any checkins yet."),
    ]);
  }

  // Checkins with photos first — matches the StraboSpot page's ordering
  const sorted = [...result].sort((a, b) => {
    if (a.photo === null && b.photo !== null) return 1;
    if (a.photo !== null && b.photo === null) return -1;
    return 0;
  });

  const checkinCards = sorted.map((checkin) =>
    h(
      "div",
      {
        key: checkin.checkin_id ?? checkin.id,
        style: { marginBottom: "1rem", borderRadius: "10px" },
      },
      createCheckins([checkin], mapRef, setInspectPosition)
    )
  );

  return h("div.checkin-container", [
    checkinCards,
    PageCarousel({ page, setPage, nextData }),
  ]);
}

function useRockdCheckins(page: number, personId: number) {
  const result = useAsyncMemo(async () => {
    return await fetchRockdCheckins(page, personId);
  }, [page, personId]);

  // Prefetched so the carousel knows whether a next page exists
  const next = useAsyncMemo(async () => {
    return await fetchRockdCheckins(page + 1, personId);
  }, [page, personId]);

  return [result, next];
}

async function fetchRockdCheckins(page: number, personId: number) {
  const res = await fetchRockdData(
    `/protected/checkins?person_id=${personId}&page=${page}`
  );
  const json = await res.json();
  return json?.success?.data ?? [];
}
