import { useMapRef } from "@macrostrat/mapbox-react";
import { Spinner } from "@blueprintjs/core";
import { useEffect, useState } from "react";
import h from "./main.module.sass";
import { useRockdAPI, pageCarousel, createCheckins } from "~/components/general";
import "@macrostrat/style-system";

export function FeatureDetails({setInspectPosition}) {
  const [page, setPage] = useState(1);
  const mapRef = useMapRef();
  const map = mapRef.current;
  const [bounds, setBounds] = useState(map?.getBounds());
  let checkins = [];
  let result;
  let nextData;

  if (bounds) {
    result = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast(), page);
    nextData = getCheckins(bounds.getSouth(), bounds.getNorth(), bounds.getWest(), bounds.getEast(), page + 1);
  } else {
    result = getCheckins(0, 0, 0, 0, 1);
    nextData = getCheckins(0, 0, 0, 0, 2);
  }

  if (!bounds && map) {
    setBounds(map.getBounds());
  }

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


  result = result?.success?.data;  
  if (result == null || result.length === 0) return h(Spinner, { className: "loading-spinner" });

  const pages = pageCarousel({page, setPage, nextData: nextData?.success.data});

  result.sort((a, b) => {
    if (a.photo === null && b.photo !== null) return 1;
    if (a.photo !== null && b.photo === null) return -1;
    return 0;
  });

  checkins = createCheckins(result, mapRef, setInspectPosition);
  
  return h("div", {className: 'checkin-container'}, [
      checkins,
      pages
    ]);
}

function getCheckins(lat1, lat2, lng1, lng2, page) {
  // abitrary bounds around click point
  let minLat = Math.floor(lat1 * 100) / 100;
  let maxLat = Math.floor(lat2 * 100) / 100;
  let minLng = Math.floor(lng1 * 100) / 100;
  let maxLng = Math.floor(lng2 * 100) / 100;

  // change use map coords
  return useRockdAPI("/protected/checkins?minlat=" + minLat + 
    "&maxlat=" + maxLat +
    "&minlng=" + minLng +
    "&maxlng=" + maxLng + 
    "&page="  + page);
}