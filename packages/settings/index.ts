/* Client-side code to access configuration variables */
import { getRuntimeConfig } from "./utils";

export const rockdApiURL = getRuntimeConfig("ROCKD_API_URL");
export const rockdApiOldURL = "https://rockd.org/api/v2/";

export const darkMapURL =
  "mapbox://styles/jczaplewski/cl5uoqzzq003614o6url9ou9z?optimize=true";
export const whiteMapURL =
  "mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i?optimize=true";
export const satelliteMapURL =
  "mapbox://styles/jczaplewski/cl51esfdm000e14mq51erype3?optimize=true";

export const burwellTileDomain = getRuntimeConfig(
  "MACROSTRAT_TILESERVER_DOMAIN"
);
export const apiDomain = getRuntimeConfig("MACROSTRAT_API_DOMAIN");
export const tileserverDomain = burwellTileDomain;

export const mapboxAccessToken = getRuntimeConfig("MAPBOX_API_TOKEN");

export const baseURL = getRuntimeConfig("BASE_URL", "/");

export const ingestPrefix = getRuntimeConfig(
  "MACROSTRAT_INGEST_API",
  apiDomain + "/api/ingest"
);

export const matomoToken = getRuntimeConfig("MATOMO_API_TOKEN");

/** Legacy settings object */
export const SETTINGS = {
  rockdApiURL,
  darkMapURL,
  whiteMapURL,
  satelliteMapURL,
  burwellTileDomain,
  mapboxAccessToken,
  rockdApiOldURL,
  matomoToken,
};
