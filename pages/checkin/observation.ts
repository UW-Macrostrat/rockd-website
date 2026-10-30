import { Card } from "@blueprintjs/core";
import { LithologyList, LngLatCoords } from "@macrostrat/data-components";
import hyper from "@macrostrat/hyper";
import { getImageUrl } from "~/components";
import { ReservedImage } from "~/components/checkin-feed/checkin-card-parts";
import { macrostratApiURL } from "~/settings";
import styles from "./main.module.sass";

const h = hyper.styled(styles);

/** A checkin's observation as a card: its photo (opening the photo page),
 * then its details. */
export function ObservationCard({ observation, personId }) {
  let photo = null;
  if (observation.photo != null) {
    photo = h(
      "a.observation-photo-link",
      { href: `/photo/${observation.photo}` },
      // The checkin cards' square photo box
      h(ReservedImage, {
        className: "checkin-photo",
        src: getImageUrl(personId, observation.photo),
        alt: "Observation photo",
      })
    );
  }

  return h(Card, { className: "observation-card" }, [
    photo,
    h(ObservationDetails, { observation }),
  ]);
}

/**
 * What an observation records, below its photo, centered: its strike, dip and
 * the like as a small table; its rocks (lithologies, age, formation, map unit)
 * and orientation feature as Macrostrat tags, linking to their Macrostrat
 * pages; its notes; and its own location. Empty when there's none of that.
 * Also the photo page's.
 */
export function ObservationDetails({ observation }) {
  const tags = observationTags(observation);
  const notes = observation.rocks?.notes;
  const measures = orientationMeasures(observation.orientation);

  let location = null;
  if (observation.lat != null && observation.lng != null) {
    location = h(LngLatCoords, {
      position: { lat: observation.lat, lng: observation.lng },
      precision: 3,
      zoom: 10,
    });
  }

  if (tags.length === 0 && !notes && measures.length === 0 && location == null) {
    return null;
  }

  return h("div.observation-details", [
    h.if(measures.length > 0)(OrientationMeasures, { measures }),
    h.if(tags.length > 0)(LithologyList, {
      lithologies: tags,
      onClickItem: openMacrostratPage,
    }),
    h.if(Boolean(notes))("p.observation-notes", notes),
    h.if(location != null)("div.observation-location", location),
  ]);
}

/** Whether an observation has anything to show */
export function hasObservationContent(observation): boolean {
  return (
    observation.photo != null ||
    observation.lat != null ||
    observationTags(observation).length > 0 ||
    Boolean(observation.rocks?.notes) ||
    orientationMeasures(observation.orientation).length > 0
  );
}

/** An observation's measurements as a small table: a row of captions over a
 * row of values */
function OrientationMeasures({ measures }: { measures: Measure[] }) {
  return h("table.orientation", [
    h(
      "thead",
      h(
        "tr",
        measures.map(({ label }) =>
          h("th.measure-label", { key: label, scope: "col" }, label)
        )
      )
    ),
    h(
      "tbody",
      h(
        "tr",
        measures.map(({ label, value }) =>
          h("td.measure-value", { key: label }, value)
        )
      )
    ),
  ]);
}

/** An observation's rocks and orientation feature, as `LithologyList` items */
function observationTags(observation) {
  const rocks = observation.rocks ?? {};
  const tags = [];

  for (const lith of rocks.liths ?? []) {
    let color = lith.color;
    if (color != null && !color.includes("#")) color = rgbaToHex(color);
    tags.push({ ...lith, color });
  }
  if (rocks.interval?.name) {
    let color = rocks.interval.color;
    if (color != null && !color.includes("#")) color = `rgba(${color})`;
    tags.push({
      name: rocks.interval.name,
      int_id: rocks.interval.int_id,
      color,
    });
  }
  if (rocks.strat_name?.strat_name_long) {
    tags.push({
      name: rocks.strat_name.strat_name_long,
      strat_name_id: rocks.strat_name.strat_name_id,
    });
  }
  if (rocks.map_unit?.unit_name) {
    tags.push({
      name: rocks.map_unit.unit_name,
      unit_id: rocks.map_unit.unit_id,
    });
  }
  const feature = observation.orientation?.feature?.name;
  // `LithologyList` needs an id to render an item; -1 links nowhere
  if (feature) tags.push({ name: feature, int_id: -1 });

  return tags;
}

interface Measure {
  label: string;
  value: string;
}

/** Whichever of an observation's strike, dip, dip direction (with its compass
 * point), trend and plunge were recorded */
function orientationMeasures(orientation): Measure[] {
  if (orientation == null) return [];
  const { strike, dip, dip_dir, trend, plunge } = orientation;
  const measures: Measure[] = [];
  if (strike != null) measures.push({ label: "Strike", value: `${strike}°` });
  if (dip != null) measures.push({ label: "Dip", value: `${dip}°` });
  if (dip_dir != null) {
    measures.push({
      label: "Dip direction",
      value: `${dip_dir}° ${compassPoint(dip_dir)}`,
    });
  }
  if (trend != null) measures.push({ label: "Trend", value: `${trend}°` });
  if (plunge != null) measures.push({ label: "Plunge", value: `${plunge}°` });
  return measures;
}

const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** The nearest of the eight compass points to a bearing in degrees */
function compassPoint(degrees: number): string {
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return COMPASS_POINTS[index];
}

/** A tag's Macrostrat page, in a new tab */
function openMacrostratPage(_event, item) {
  let path: string | null = null;
  if (item.int_id > 0) path = `/lex/intervals/${item.int_id}`;
  if (item.strat_name_id != null) path = `/lex/strat-names/${item.strat_name_id}`;
  if (item.lith_id != null) path = `/lex/lithology/${item.lith_id}`;
  if (path != null) window.open(macrostratApiURL + path, "_blank");
}

/** "r, g, b, a" as "#rrggbb" (the alpha dropped) */
function rgbaToHex(rgba: string): string {
  const [r, g, b] = rgba.split(",").map((value) => parseInt(value.trim(), 10));
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}
