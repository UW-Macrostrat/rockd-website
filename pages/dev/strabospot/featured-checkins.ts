import { Spinner } from "@blueprintjs/core";
import { useState } from "react";
import h from "../../explore/main.module.sass";
import { PageCarousel, fetchRockdData } from "~/components";
import { createCheckins } from "~/components/checkin.client";
import { useAsyncMemo } from "@macrostrat/ui-components";
import { useMapRef } from "@macrostrat/mapbox-react";

const PERSON_ID = 127426;

export function FeatureDetails({ setInspectPosition }) {
  const [page, setPage] = useState(1);
  const mapRef = useMapRef();

  const [result, nextData] = useRockdCheckins(page);

  if (result == null) {
    return h(Spinner, { className: "loading-spinner" });
  }

  if (result.length === 0) {
    return h("div.checkin-container", [
      h("p", `No checkins found for person_id=${PERSON_ID}`),
    ]);
  }

  const pages = PageCarousel({
    page,
    setPage,
    nextData,
  });

  const sorted = [...result].sort((a, b) => {
    if (a.photo === null && b.photo !== null) return 1;
    if (a.photo !== null && b.photo === null) return -1;
    return 0;
  });

  const checkins = createCheckins(sorted, mapRef, setInspectPosition);

  return h("div.checkin-container", [checkins, pages]);
}

function useRockdCheckins(page: number) {
  const result = useAsyncMemo(async () => {
    return await fetchRockdCheckins(page);
  }, [page]);

  const next = useAsyncMemo(async () => {
    return await fetchRockdCheckins(page + 1);
  }, [page]);

  return [result, next];
}

async function fetchRockdCheckins(page: number) {
  const res = await fetchRockdData(
    `/protected/checkins?person_id=${PERSON_ID}&page=${page}`
  );
  const json = await res.json();
  return json?.success?.data ?? [];
}
