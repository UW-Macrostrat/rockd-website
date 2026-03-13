import { useMapPosition, useMapRef } from "@macrostrat/mapbox-react";
import { Spinner } from "@blueprintjs/core";
import { useEffect, useState } from "react";
import h from "./main.module.sass";
import { pageCarousel, fetchRockdData } from "~/components";
import { createCheckins } from "~/components/checkin.client";
import { useAsyncMemo } from "@macrostrat/ui-components";

export function FeatureDetails({ setInspectPosition }) {
  const [page, setPage] = useState(1);
  const mapRef = useMapRef();

  const map = mapRef.current;
  const [bounds, setBounds] = useState(map?.getBounds());

  const position = useMapPosition();
  useEffect(() => {
    setBounds(map?.getBounds());
  }, [position]);

  let checkins = [];

  const [result, nextData] = useRockdCheckins(bounds, page);

  useEffect(() => {
    if (!map) return;

    const handleMapReady = () => {
      const newBounds = map.getBounds();
      setBounds(newBounds);
      setPage(1);
    };

    if (map.isStyleLoaded()) {
      handleMapReady();
    } else {
      map.once("load", handleMapReady);
    }

    const onMoveEnd = () => {
      const newBounds = map.getBounds();
      setBounds(newBounds);
      setPage(1);
    };

    map.on("moveend", onMoveEnd);

    return () => {
      map.off("moveend", onMoveEnd);
      map.off("load", handleMapReady);
    };
  }, [map]);

  if (result == null || result.length === 0)
    return h(Spinner, { className: "loading-spinner" });

  const pages = pageCarousel({
    page,
    setPage,
    nextData,
  });

  result.sort((a, b) => {
    if (a.photo === null && b.photo !== null) return 1;
    if (a.photo !== null && b.photo === null) return -1;
    return 0;
  });

  checkins = createCheckins(result, mapRef, setInspectPosition);

  return h("div.checkin-container", [checkins, pages]);
}

function useRockdCheckins(bounds: any, page: number) {
  const result = useAsyncMemo(async () => {
    return await fetchRockdCheckinsByBounds(bounds, page);
  }, [bounds, page]);

  const next = useAsyncMemo(async () => {
    return await fetchRockdCheckinsByBounds(bounds, page + 1);
  }, [bounds, page]);

  return [result, next];
}

async function fetchRockdCheckinsByBounds(bounds: any, page: number) {
  const res = await fetchRockdCheckins(
    bounds?.getSouth() ?? 0,
    bounds?.getNorth() ?? 0,
    bounds?.getWest() ?? 0,
    bounds?.getEast() ?? 0,
    page
  );
  return res?.success?.data;
}

async function fetchRockdCheckins(lat1, lat2, lng1, lng2, page) {
  // abitrary bounds around click point
  let minLat = Math.floor(lat1 * 100) / 100;
  let maxLat = Math.floor(lat2 * 100) / 100;
  let minLng = Math.floor(lng1 * 100) / 100;
  let maxLng = Math.floor(lng2 * 100) / 100;

  // change use map coords
  const res = await fetchRockdData(
    "/protected/checkins?minlat=" +
      minLat +
      "&maxlat=" +
      maxLat +
      "&minlng=" +
      minLng +
      "&maxlng=" +
      maxLng +
      "&page=" +
      page
  );
  // Get json
  return res.json();
}
