/**
 * The feed's view definition: which columns can be sorted, which filters exist,
 * how each translates into a `/protected/checkins` query param, and how each is
 * represented in the URL so a particular search is a link.
 *
 * Everything here is *declaration*; the request assembly lives in
 * `./checkin-provider`, and the presentation in `./feed-page`.
 *
 * The id-keyed *semantic* facets (age, lithology, person) live in `./semantic`,
 * which handles the parts they don't share with the notes search: a remote
 * vocabulary, and labels that have to be fetched for ids restored from a URL.
 * All of them live behind **one** filter (`semanticFilter`), whose form is a
 * segmented type selector plus the picker for the chosen facet — so the toolbar
 * keeps a single "Filters" affordance however many facets exist. Its state is
 * `{ [facetId]: number[] }`, and the three loops at the bottom of this file turn
 * that into query params and URL params.
 */
import h from "@macrostrat/hyper";
import { InputGroup } from "@blueprintjs/core";
import {
  isSemanticEmpty,
  SemanticFilterControl,
  type SemanticState,
} from "./semantic/controls";
import { SEMANTIC_FACETS } from "./semantic/facets";
import type { ColumnSpec, FetchDataFilter, TableFilter } from "@macrostrat/data-sheet";
import type { FilterURLBinding } from "~/_utils/data-view-url-state";
import type { Checkin } from "./checkin-provider";

// ---- Notes search ----
// The route matches `notes` with a `%…%` ILIKE, which is the only free-text
// search it offers. It's the common case, so it sits in the toolbar rather than
// behind the filter menu.

export const NOTES_FILTER_ID = "checkin-notes";

interface NotesState {
  text: string;
}

function NotesFilterForm({
  state,
  setState,
}: {
  state: NotesState;
  setState: (s: NotesState | null) => void;
}) {
  return h(InputGroup, {
    className: "checkin-search",
    leftIcon: "search",
    placeholder: "Search checkin notes…",
    value: state?.text ?? "",
    onValueChange: (text: string) => {
      if (text === "") {
        setState(null);
        return;
      }
      setState({ text });
    },
  });
}

export const notesFilter: TableFilter<Checkin, NotesState> = {
  id: NOTES_FILTER_ID,
  name: "Notes",
  icon: "search",
  columnKey: "notes",
  defaultState: { text: "" },
  presentation: "inline",
  describeState: (s) => {
    const text = (s?.text ?? "").trim();
    if (text === "") return null;
    return text;
  },
  // `TableFilter.filterForm` types `setState` as `(state: S) => void`, but the
  // runtime contract accepts `null` to clear the filter — which is how a filter
  // goes empty, and what every consumer does. The cast is the type gap, not a
  // behavior change (`@macrostrat/data-sheet` tracks it as `TableFilter.isEmpty`).
  filterForm: NotesFilterForm as TableFilter<Checkin, NotesState>["filterForm"],
  // Server-side via `translateCheckinFilter`; this is the in-memory equivalent,
  // for a local provider (a story, a fixture).
  predicate: (row, s) => {
    const q = (s?.text ?? "").trim().toLowerCase();
    if (q === "") return true;
    return (row?.notes ?? "").toLowerCase().includes(q);
  },
};

// ---- Semantic facets, as one filter ----

export const SEMANTIC_FILTER_ID = "checkin-semantics";

export const semanticFilter: TableFilter<Checkin, SemanticState> = {
  id: SEMANTIC_FILTER_ID,
  name: "Filters",
  icon: "filter-list",
  defaultState: {},
  presentation: "menu-inline",
  describeState: (s) => {
    const parts = SEMANTIC_FACETS.map((f) => (s?.[f.id] ?? []).length).filter(
      (n) => n > 0
    );
    if (parts.length === 0) return null;
    const total = parts.reduce((a, b) => a + b, 0);
    return `${total} selected`;
  },
  // Server-side only: these select on joined observation data that the loaded
  // row doesn't carry, so there is nothing to test in memory.
  predicate: () => true,
  filterForm: (({ state, setState }) =>
    h(SemanticFilterControl, {
      state: state ?? {},
      onChange: (next: SemanticState | null) => setState(next as any),
    })) as TableFilter<Checkin, SemanticState>["filterForm"],
};

/** Filters spanning more than one column, or none — passed as the panel's
 * `filters`. Per-column facets are declared on `columnSpec` instead. */
export const tableFilters: TableFilter<Checkin>[] = [
  notesFilter,
  semanticFilter,
];

// ---- Columns ----
// Only the sortable set and the search's subject matter here: the panel builds
// its Sort menu from `sortable`, and there is no table renderer to lay out.
//
// `likes` is intentionally not sortable — the route's `orderBy=likes` branch
// emits invalid SQL (it appends to an empty ORDER BY). Add it once that's fixed
// in the `rockd` repo.

export const columnSpec: ColumnSpec[] = [
  { key: "notes", name: "Notes", dataType: "text" },
  { key: "created", name: "Date observed", dataType: "string", sortable: true },
  { key: "added", name: "Date added", dataType: "string", sortable: true },
  { key: "rating", name: "Rating", dataType: "integer", sortable: true },
  { key: "near", name: "Location", dataType: "string" },
  { key: "likes", name: "Likes", dataType: "integer" },
];

// ---- Server translation ----

/** A filter → the query params it contributes. `null` for an empty filter. */
export function translateCheckinFilter(
  f: FetchDataFilter
): Record<string, string> | null {
  if (f.id === NOTES_FILTER_ID) {
    const text = (f.state?.text ?? "").trim();
    if (text === "") return null;
    return { notes: text };
  }
  // Comma-separated ids: OR within a facet, AND across facets (the route ANDs
  // its where-clauses).
  if (f.id === SEMANTIC_FILTER_ID) {
    const params: Record<string, string> = {};
    for (const facet of SEMANTIC_FACETS) {
      const ids = f.state?.[facet.id] ?? [];
      if (ids.length > 0) params[facet.param] = ids.join(",");
    }
    if (Object.keys(params).length === 0) return null;
    return params;
  }
  return null;
}

// ---- URL bindings ----

/** One binding owning every facet's param (`?age=`, `?lith=`, `?person=`).
 *
 * Ids only — never names. The ids are what the query *is*; a name in the URL
 * would be a second copy of the truth, able to go stale, and resolving it later
 * would change view state and re-fetch the feed for nothing (see
 * `semantic/label-cache.ts`). */
const semanticBinding: FilterURLBinding<SemanticState> = {
  filter: semanticFilter,
  params: SEMANTIC_FACETS.map((f) => f.urlParam),
  toParams: (state) => {
    const out: Record<string, string | null> = {};
    for (const facet of SEMANTIC_FACETS) {
      out[facet.urlParam] = (state?.[facet.id] ?? []).join(",") || null;
    }
    return out;
  },
  fromParams: (values) => {
    const state: SemanticState = {};
    for (const facet of SEMANTIC_FACETS) {
      const raw = values[facet.urlParam];
      if (raw == null || raw === "") continue;
      const ids = raw
        .split(",")
        .map((d) => parseInt(d, 10))
        .filter((d) => Number.isFinite(d));
      if (ids.length > 0) state[facet.id] = ids;
    }
    if (isSemanticEmpty(state)) return null;
    return state;
  },
};

export const urlBindings: FilterURLBinding[] = [
  semanticBinding,
  {
    filter: notesFilter,
    params: ["q"],
    toParams: (s: NotesState) => ({ q: s?.text?.trim() || null }),
    fromParams: ({ q }) => {
      if (q == null || q.trim() === "") return null;
      return { text: q };
    },
  },
];
