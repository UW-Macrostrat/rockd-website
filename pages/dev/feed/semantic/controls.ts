/**
 * The semantic facets' controls, behind one segmented type selector.
 *
 * All three facets share a single filter and a single dropdown: a
 * `SegmentedControl` picks which facet you're adding to, and the picker below
 * changes with it. That keeps the toolbar to one "Filters" affordance however
 * many facets exist, and — because the selection for *every* facet stays
 * visible above the selector — switching type never hides what you've already
 * chosen.
 *
 * The two pickers differ because the vocabularies want opposite affordances:
 *
 *  - **Age** is a fixed ~180-item hierarchy with colors and age ranges. People
 *    recognize an interval rather than spell it, so the whole vocabulary is
 *    fetched once and browsed, grouped by rank; typing only *narrows* it.
 *  - **Person / lithology** are large open vocabularies with no useful ordering,
 *    reachable only by search.
 *
 * `AsyncItemSelector` is hand-rolled rather than a Blueprint `MultiSelect`: that
 * component fires item-select and its own query reset as two handlers in one
 * batch off the same snapshot, so the second reverts the first (the trap
 * `@macrostrat/data-sheet` tracks as "`setState` should accept an updater").
 */
import { Button, InputGroup, SegmentedControl, Spinner } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./controls.module.sass";
import {
  fetchIntervalRanks,
  INTERVAL_RANKS,
  SEMANTIC_FACETS,
  type FacetItem,
  type SemanticFacet,
} from "./facets";
import { useFacetItems, useRecordItems } from "./label-cache";
import { FacetTag } from "./tags";

const h = hyper.styled(styles);

const SEARCH_DEBOUNCE = 250;

/** Ids selected per facet, keyed by facet id. The filter's whole state. */
export type SemanticState = Record<string, number[]>;

export interface SemanticControlProps {
  state: SemanticState;
  onChange: (state: SemanticState | null) => void;
}

/** True when no facet holds anything — the filter should then go inactive
 * rather than linger as an "active" filter with nothing in it. */
export function isSemanticEmpty(state: SemanticState | null): boolean {
  if (state == null) return true;
  return SEMANTIC_FACETS.every((f) => (state[f.id] ?? []).length === 0);
}

export function SemanticFilterControl({
  state,
  onChange,
}: SemanticControlProps) {
  const [activeId, setActiveId] = useState(SEMANTIC_FACETS[0].id);
  const facet =
    SEMANTIC_FACETS.find((f) => f.id === activeId) ?? SEMANTIC_FACETS[0];

  const setIds = (ids: number[]) => {
    const next = { ...state, [facet.id]: ids };
    if (isSemanticEmpty(next)) {
      onChange(null);
      return;
    }
    onChange(next);
  };

  let picker = null;
  if (facet.control === "intervals") {
    picker = h(IntervalPicker, { facet, ids: state?.[facet.id] ?? [], setIds });
  } else {
    picker = h(SearchPicker, { facet, ids: state?.[facet.id] ?? [], setIds });
  }

  return h("div.semantic-control", [
    h(SelectionSummary, { state, onChange }),
    h(SegmentedControl, {
      className: "facet-type",
      small: true,
      fill: true,
      options: SEMANTIC_FACETS.map((f) => ({ label: f.name, value: f.id })),
      value: activeId,
      onValueChange: setActiveId,
    }),
    picker,
  ]);
}

/** Everything selected, across every facet — so switching type doesn't hide
 * what another facet holds. */
function SelectionSummary({ state, onChange }: SemanticControlProps) {
  const active = SEMANTIC_FACETS.filter(
    (f) => (state?.[f.id] ?? []).length > 0
  );
  if (active.length === 0) return null;

  return h(
    "div.selection-summary",
    active.map((facet) =>
      h(FacetChips, {
        key: facet.id,
        facet,
        ids: state[facet.id],
        onChange: (ids: number[]) => {
          const next = { ...state, [facet.id]: ids };
          if (isSemanticEmpty(next)) {
            onChange(null);
            return;
          }
          onChange(next);
        },
      })
    )
  );
}

export function FacetChips({
  facet,
  ids,
  onChange,
}: {
  facet: SemanticFacet;
  ids: number[];
  onChange: (ids: number[]) => void;
}) {
  const items = useFacetItems(facet, ids);
  if (ids.length === 0) return null;

  return h(
    "div.facet-chips",
    items.map((item) =>
      h(FacetTag, {
        key: item.id,
        facet,
        item,
        onRemove: () => onChange(ids.filter((id) => id !== item.id)),
      })
    )
  );
}

interface PickerProps {
  facet: SemanticFacet;
  ids: number[];
  setIds: (ids: number[]) => void;
}

// ---- Age: browse the timescale ----

function IntervalPicker({ facet, ids, setIds }: PickerProps) {
  const [vocabulary, setVocabulary] = useState<FacetItem[] | null>(null);
  const [ranks, setRanks] = useState<Map<number, string> | null>(null);
  const [query, setQuery] = useState("");
  const record = useRecordItems();

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      facet.vocabulary?.(controller.signal) ?? Promise.resolve([]),
      fetchIntervalRanks(controller.signal),
    ])
      .then(([items, rankMap]) => {
        if (controller.signal.aborted) return;
        setVocabulary(items);
        setRanks(rankMap);
        // The whole timescale is now known, so no chip ever needs resolving.
        record(facet, items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setVocabulary([]);
      });
    return () => controller.abort();
  }, [facet, record]);

  const groups = useMemo(
    () => groupByRank(vocabulary ?? [], ranks, query),
    [vocabulary, ranks, query]
  );

  let body = null;
  if (vocabulary == null) {
    body = h("div.control-loading", h(Spinner, { size: 16 }));
  } else if (groups.length === 0) {
    body = h("div.control-empty", "No matching intervals");
  } else {
    body = h(
      "div.interval-groups",
      groups.map(({ rank, items }) =>
        h("div.interval-group", { key: rank }, [
          h("div.group-label", rank),
          h(
            "div.interval-options",
            items.map((item) =>
              h(FacetTag, {
                key: item.id,
                facet,
                item,
                onClick: () => setIds(toggle(ids, item.id)),
              })
            )
          ),
        ])
      )
    );
  }

  return h("div.picker", [
    h(InputGroup, {
      className: "facet-search",
      leftIcon: "search",
      placeholder: "Narrow the timescale…",
      value: query,
      onValueChange: setQuery,
    }),
    h("div.picker-scroll", body),
  ]);
}

function groupByRank(
  items: FacetItem[],
  ranks: Map<number, string> | null,
  query: string
): { rank: string; items: FacetItem[] }[] {
  const q = query.trim().toLowerCase();
  const matching = items.filter(
    (item) => q === "" || item.name.toLowerCase().includes(q)
  );
  const byRank = new Map<string, FacetItem[]>();
  for (const item of matching) {
    const rank = ranks?.get(item.id) ?? "other";
    const list = byRank.get(rank) ?? [];
    list.push(item);
    byRank.set(rank, list);
  }
  const order = [...INTERVAL_RANKS, "other"];
  return order
    .filter((rank) => (byRank.get(rank) ?? []).length > 0)
    .map((rank) => ({ rank, items: byRank.get(rank) ?? [] }));
}

// ---- Person / lithology: type to search ----

function SearchPicker({ facet, ids, setIds }: PickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FacetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const record = useRecordItems();

  // The selection at the moment of a click, not at the moment this callback was
  // created — a result can be clicked while a newer search is settling.
  const idsRef = useRef(ids);
  idsRef.current = ids;

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || facet.search == null) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      facet
        .search!(term, controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          setResults(items);
          setLoading(false);
          // Cache now, so the chip has a name the instant it's selected.
          record(facet, items);
        })
        .catch(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, SEARCH_DEBOUNCE);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, facet, record]);

  const unselected = results.filter((item) => !ids.includes(item.id));

  let body = null;
  if (loading) {
    body = h("div.control-loading", h(Spinner, { size: 16 }));
  } else if (query.trim().length < 2) {
    body = h("div.control-empty", `Type to search ${facet.name.toLowerCase()}`);
  } else if (unselected.length === 0) {
    body = h("div.control-empty", "No matches");
  } else {
    body = h(
      "div.result-list",
      unselected.map((item) =>
        h(
          Button,
          {
            key: item.id,
            className: "result",
            minimal: true,
            alignText: "left",
            fill: true,
            onClick: () => setIds(toggle(idsRef.current, item.id)),
          },
          item.name
        )
      )
    );
  }

  return h("div.picker", [
    h(InputGroup, {
      className: "facet-search",
      leftIcon: "search",
      placeholder: `Search ${facet.name.toLowerCase()}…`,
      value: query,
      onValueChange: setQuery,
    }),
    h("div.picker-scroll", body),
  ]);
}

function toggle(ids: number[], id: number): number[] {
  if (ids.includes(id)) return ids.filter((d) => d !== id);
  return [...ids, id];
}
