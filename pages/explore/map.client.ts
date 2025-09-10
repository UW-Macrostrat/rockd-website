import {
  MapAreaContainer,
  MapMarker,
  MapView,
} from "@macrostrat/map-interface";
import h from "./main.module.sass";
import "@macrostrat/style-system";
import { mapboxAccessToken } from "~/settings";
import mapboxgl from "mapbox-gl";
import { useEffect } from "react";
import { useMapRef } from "@macrostrat/mapbox-react";
