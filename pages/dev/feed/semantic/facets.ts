/**
 * Semantic facets — the checkin filters that select on *meaning* (age,
 * lithology, who) rather than on a column of the row.
 *
 * Three things make these different from a text search, and they're what the
 * rest of this directory exists to handle:
 *
 * 1. **The API speaks ids; people speak names.** `/protected/checkins` takes
 *    `int_id=63`, `lith_id=53`, `person_id=8105` (comma-separated = OR within a
 *    facet, AND across facets). So a filter's *state* — and its URL form — is a
 *    set of ids, and every label shown in the UI has to be fetched.
 * 2. **The vocabulary is remote.** It can't come from the loaded rows
 *    (`TableDataProvider.distinctValues` is for columns of the source; these are
 *    ids in joined tables), so each facet brings its own.
 * 3. **Searching and resolving are different operations.** Rockd's
 *    `/autocomplete/:term` searches by term but cannot look an id back up;
 *    Macrostrat's `/defs/*` can do both.
 *
 * A facet supplies **either** a `vocabulary` (small enough to hold in memory —
 * intervals, lithologies) **or** a `search` (open-ended — people). Holding the
 * vocabulary is much the better case: search becomes local and instant, ids
 * resolve for free, and `commonOptions` can offer something useful before a
 * single character is typed.
 *
 * Adding a facet is adding an entry here. `structure_id`, `lith_att_id`,
 * `mineral_id` and `strat_name_id` all work against the API and all have
 * `/defs/*` equivalents. `taxon_id` does NOT — it returns a 500 for every id
 * tried — so it stays out until the `rockd` API is fixed.
 */
import { macrostratApiURL, rockdApiURL } from "~/settings";

export interface FacetItem {
  id: number;
  name: string;
  /** Interval / lithology color, used by the shared tags. */
  color?: string;
  /** Secondary text on the option row. */
  detail?: string;
  /** Intervals only, for `IntervalTag`'s age range. */
  b_age?: number;
  t_age?: number;
  /** Section this item belongs to in the "all options" panel (an interval's
   * rank, a lithology's class). */
  group?: string;
  /** Ranking for `commonOptions` and within-group ordering — bigger is more
   * prominent (a lithology's unit count, an interval's span). */
  weight?: number;
}

/** Which shared tag renders this facet's values. `interval` and `lithology` map
 * to `IntervalTag` / `LithologyTag` in `@macrostrat/data-components`, so age and
 * lithology look the same here as everywhere else in Macrostrat; `plain` is a
 * Blueprint tag, for a facet with no domain tag of its own (people). */
export type FacetTagKind = "interval" | "lithology" | "plain";

export interface SemanticFacet {
  /** Filter-state key, and the label-cache namespace. */
  id: string;
  name: string;
  /** Plural, for the "all options" panel title. */
  pluralName: string;
  icon: string;
  /** Query param on `/protected/checkins` — and, deliberately, the page URL's
   * param too. The feed's URL mirrors the API query it stands for, so a link is
   * readable against the API docs and there is only one name per facet. */
  param: string;
  tag: FacetTagKind;
  /** How options are laid out. `inline` wraps them as tags — right for short,
   * recognizable, colored labels (intervals, lithologies), and it fits far more
   * on screen than one row each. `rows` gives each option a full menu row, for
   * labels that need the width (people's names). */
  optionLayout: "inline" | "rows";
  /** How many options to offer before anything is typed. Generous for a facet
   * laid out inline — the point of the panel is to *show* the vocabulary. */
  summaryLimit: number;
  /** The whole vocabulary, held in memory. Preferred; see the note above. */
  vocabulary?(signal: AbortSignal): Promise<FacetItem[]>;
  /** Remote term search, for a facet too open-ended to hold. */
  search?(term: string, signal: AbortSignal): Promise<FacetItem[]>;
  /** Ids → items, for labelling a filter restored from a URL. A facet with a
   * `vocabulary` needs none — the vocabulary answers it. */
  resolve?(ids: number[], signal: AbortSignal): Promise<FacetItem[]>;
  /** What to offer before anything is typed. */
  commonOptions?(all: FacetItem[]): FacetItem[];
  /** Section order in the "all options" panel. */
  groupOrder?: string[];
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

// ---- Age ----
// Note what `int_id` means server-side: it matches checkins whose observations
// resolve to that interval — through the observation's own interval, its strat
// name, or its map unit — not a numeric age window. An age *range* is a
// different (and currently unsupported) query.

const INTERNATIONAL_TIMESCALE = 11;

/** Coarse to fine. Also the section order in the "all intervals" panel. */
export const INTERVAL_RANKS = ["eon", "era", "period", "epoch", "age"];

function intervalItem(d: any): FacetItem {
  return {
    id: d.int_id,
    name: d.name,
    color: d.color,
    b_age: d.b_age,
    t_age: d.t_age,
    group: d.int_type,
    // Longer-lived intervals first within a rank, and oldest-first reads
    // naturally for a timescale.
    weight: d.b_age,
  };
}

export const ageFacet: SemanticFacet = {
  id: "checkin-age",
  name: "Age",
  pluralName: "intervals",
  icon: "time",
  param: "int_id",
  tag: "interval",
  optionLayout: "inline",
  // Everything down to epoch. The rank sections are the point — seeing eons
  // through epochs at once is how you find the one you mean.
  summaryLimit: 120,
  groupOrder: INTERVAL_RANKS,
  async vocabulary(signal) {
    const rows = await defs(
      `intervals?timescale_id=${INTERNATIONAL_TIMESCALE}`,
      signal
    );
    return rows.map(intervalItem);
  },
  // Coarse ranks first, oldest first within a rank — the timescale's own order.
  // Not filtered to one rank: the grouped display makes the whole hierarchy
  // legible at once, which is more useful than a guess at the right level.
  commonOptions: (all) =>
    all
      .filter((d) => d.group !== "age")
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)),
};

// ---- Lithology ----
// 214 rows with unit counts, so the whole vocabulary is held: search is local
// and instant, and "common" means "most used in Macrostrat".

export const lithologyFacet: SemanticFacet = {
  id: "checkin-lithology",
  name: "Lithology",
  pluralName: "lithologies",
  icon: "cube",
  param: "lith_id",
  tag: "lithology",
  optionLayout: "inline",
  summaryLimit: 60,
  groupOrder: ["sedimentary", "igneous", "metamorphic"],
  async vocabulary(signal) {
    const rows = await defs("lithologies?all", signal);
    return rows.map((d: any) => ({
      id: d.lith_id,
      name: d.name,
      color: d.color,
      detail: d.type,
      group: d.class,
      weight: d.t_units ?? 0,
    }));
  },
  commonOptions: (all) =>
    [...all].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)),
};

// ---- Person ----
// The one facet with no vocabulary and no resolver: rockd's
// `/protected/user-profile/:id` returns 502 on dev *and* production, and
// `/autocomplete` searches by name only. So a person restored from a link shows
// as "Person 8105" until searched for. A `people?person_id=` lookup on the
// Rockd API would close this.

export const personFacet: SemanticFacet = {
  id: "checkin-person",
  name: "Person",
  pluralName: "people",
  icon: "person",
  param: "person_id",
  tag: "plain",
  // A name needs the row width, and there is nothing to show before a search.
  optionLayout: "rows",
  summaryLimit: 8,
  async search(term, signal) {
    if (term.trim().length < 2) return [];
    const url = `${rockdApiURL}/autocomplete/${encodeURIComponent(term.trim())}`;
    const body = await json(url, signal);
    const data = body?.success?.data ?? body ?? {};
    return (data.people ?? []).map((d: any) => ({ id: d.id, name: d.name }));
  },
};

export const SEMANTIC_FACETS: SemanticFacet[] = [
  ageFacet,
  lithologyFacet,
  personFacet,
];

export function facetById(id: string): SemanticFacet | undefined {
  return SEMANTIC_FACETS.find((f) => f.id === id);
}
