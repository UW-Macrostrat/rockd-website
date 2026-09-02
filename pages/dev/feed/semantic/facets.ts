/**
 * Semantic facets — the checkin filters that select on *meaning* (age,
 * lithology, who) rather than on a column of the row.
 *
 * Three things make these different from the notes search, and they're what the
 * rest of this directory exists to handle:
 *
 * 1. **The API speaks ids; people speak names.** `/protected/checkins` takes
 *    `int_id=63`, `lith_id=53`, `person_id=8105` (comma-separated = OR within a
 *    facet, AND across facets). So a filter's *state* — and its URL form — is a
 *    set of ids, and every label shown in the UI has to be fetched.
 * 2. **The vocabulary is remote and large.** It can't come from the loaded rows
 *    (`TableDataProvider.distinctValues` is for columns of the source; these are
 *    ids in joined tables), so each facet carries its own `search`.
 * 3. **Searching and resolving are different operations, from different
 *    services.** Rockd's `/autocomplete/:term` searches by term but cannot look
 *    an id back up; Macrostrat's `/defs/*` can do both. A facet therefore
 *    declares `search` and `resolve` separately, and may have only one.
 *
 * Adding a facet is adding an entry here. `structure_id`, `lith_att_id`,
 * `mineral_id` and `strat_name_id` all work against the API and all have
 * `/defs/*` resolvers, so they are a few lines each when wanted. `taxon_id` is
 * NOT — it returns a 500 for every id tried, so it stays out until the `rockd`
 * API is fixed.
 */
import { macrostratApiURL, rockdApiURL } from "~/settings";

export interface FacetItem {
  id: number;
  name: string;
  /** Interval color, etc. — shown on the chip when present. */
  color?: string;
  /** Secondary line (a lithology's class, an interval's age range). */
  detail?: string;
  /** Intervals only, for `IntervalTag`'s age range. */
  b_age?: number;
  t_age?: number;
}

export type FacetControl = "search" | "intervals";

/** Which shared tag renders this facet's values. `interval` and `lithology` map
 * to `IntervalTag` / `LithologyTag` in `@macrostrat/data-components`, so age and
 * lithology look the same here as everywhere else in Macrostrat; `plain` is a
 * Blueprint tag, for a facet with no domain tag of its own (people). */
export type FacetTag = "interval" | "lithology" | "plain";

export interface SemanticFacet {
  /** Filter id, and the label-cache namespace. */
  id: string;
  name: string;
  icon: string;
  /** Query param on `/protected/checkins`. */
  param: string;
  /** Query param in the page URL. */
  urlParam: string;
  /** Which control renders it. */
  control: FacetControl;
  /** Which shared tag renders its selected values. */
  tag: FacetTag;
  /** Term → candidate items. Omitted for a facet whose whole vocabulary is
   * offered at once (see `intervals`). */
  search?(term: string, signal: AbortSignal): Promise<FacetItem[]>;
  /** Ids → items, for labelling a filter restored from a URL. Omitted when the
   * service can't look ids up; the control then shows a bare id. */
  resolve?(ids: number[], signal: AbortSignal): Promise<FacetItem[]>;
  /** The entire vocabulary, for `control: "intervals"`. */
  vocabulary?(signal: AbortSignal): Promise<FacetItem[]>;
}

const DEFS = `${macrostratApiURL}/api/v2/defs`;

async function json(url: string, signal: AbortSignal): Promise<any> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function defs(path: string, signal: AbortSignal): Promise<any[]> {
  const body = await json(`${DEFS}/${path}`, signal);
  return body?.success?.data ?? [];
}

/** Rockd's cross-category autocomplete, narrowed to one of its categories. */
async function autocomplete(
  term: string,
  category: string,
  signal: AbortSignal
): Promise<any[]> {
  if (term.trim().length < 2) return [];
  const url = `${rockdApiURL}/autocomplete/${encodeURIComponent(term.trim())}`;
  const body = await json(url, signal);
  const data = body?.success?.data ?? body ?? {};
  return data[category] ?? [];
}

// ---- Age ----
// The one facet with no text search, deliberately: the international timescale
// is a fixed, ~180-item hierarchy that people navigate by *recognition*, and it
// carries colors and age ranges that a plain text list would throw away. So the
// whole vocabulary is fetched once and browsed.
//
// Note what `int_id` means server-side: it matches checkins whose observations
// resolve to that interval — through the observation's own interval, its
// strat name, or its map unit — not a numeric age window. An age *range* slider
// would be a different (and currently unsupported) query.

const INTERNATIONAL_TIMESCALE = 11;

function intervalItem(d: any): FacetItem {
  return {
    id: d.int_id,
    name: d.name,
    color: d.color,
    b_age: d.b_age,
    t_age: d.t_age,
  };
}

export const ageFacet: SemanticFacet = {
  id: "checkin-age",
  name: "Age",
  icon: "time",
  param: "int_id",
  urlParam: "age",
  control: "intervals",
  tag: "interval",
  async vocabulary(signal) {
    const rows = await defs(
      `intervals?timescale_id=${INTERNATIONAL_TIMESCALE}`,
      signal
    );
    return rows.map(intervalItem);
  },
  async resolve(ids, signal) {
    const rows = await defs(`intervals?int_id=${ids.join(",")}`, signal);
    return rows.map(intervalItem);
  },
};

/** Coarse-to-fine rank, for grouping the interval picker. */
export const INTERVAL_RANKS = ["eon", "era", "period", "epoch", "age"];

/** `int_type` isn't on `FacetItem`, so the picker groups by a lookup built from
 * the same fetch. Kept here so the vocabulary shape stays in one place. */
export async function fetchIntervalRanks(
  signal: AbortSignal
): Promise<Map<number, string>> {
  const rows = await defs(
    `intervals?timescale_id=${INTERNATIONAL_TIMESCALE}`,
    signal
  );
  return new Map(rows.map((d: any) => [d.int_id, d.int_type]));
}

// ---- Person ----
// The only facet with no resolver: rockd's `/protected/user-profile/:id` returns
// 502 on both dev and production, and `/autocomplete` searches by name only. So
// a person restored from a link shows as "Person 8105" until it's searched for.
// A `people?person_id=` lookup on the Rockd API would close this.

export const personFacet: SemanticFacet = {
  id: "checkin-person",
  name: "Person",
  icon: "person",
  param: "person_id",
  urlParam: "person",
  control: "search",
  tag: "plain",
  async search(term, signal) {
    const rows = await autocomplete(term, "people", signal);
    return rows.map((d: any) => ({ id: d.id, name: d.name }));
  },
};

// ---- Lithology ----

export const lithologyFacet: SemanticFacet = {
  id: "checkin-lithology",
  name: "Lithology",
  icon: "cube",
  param: "lith_id",
  urlParam: "lith",
  control: "search",
  tag: "lithology",
  async search(term, signal) {
    const rows = await autocomplete(term, "lithologies", signal);
    return rows.map((d: any) => ({ id: d.id, name: d.name }));
  },
  async resolve(ids, signal) {
    const rows = await defs(`lithologies?lith_id=${ids.join(",")}`, signal);
    return rows.map((d: any) => ({
      id: d.lith_id,
      name: d.name,
      color: d.color,
      detail: d.class,
    }));
  },
};

export const SEMANTIC_FACETS: SemanticFacet[] = [
  ageFacet,
  lithologyFacet,
  personFacet,
];
