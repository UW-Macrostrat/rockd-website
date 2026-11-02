/**
 * The observation editor's vocabulary pickers, each a controlled field over
 * the Rockd record shape (`~/checkin-editor/types`). Vocabularies held whole
 * (intervals, lithologies, minerals, structures) use `TagPicker` /
 * `LithologyPicker` from `@macrostrat/data-components`, with lithologies and
 * intervals supplied by the enclosing `MacrostratDataProvider`; the two that
 * are searched remotely (stratigraphic names, taxa) use Blueprint's `Suggest`
 * and `MultiSelect`. Both styles give the same shape of value back.
 */
import { Button, MenuItem, Spinner } from "@blueprintjs/core";
import { MultiSelect, Suggest, type ItemRenderer } from "@blueprintjs/select";
import {
  LithologyPicker,
  TagPicker,
  TagSize,
  type PickerItem,
  type UnitLithologyValue,
} from "@macrostrat/data-components";
import { useIntervals, useLithAttributes } from "@macrostrat/data-provider";
import hyper from "@macrostrat/hyper";
import { useMemo, useState } from "react";
import {
  PBDB_THUMB,
  useMinerals,
  useStratNameSearch,
  useStructures,
  useTaxonSearch,
  type IntervalRef,
  type LithologyRef,
  type MapUnitRef,
  type MineralRef,
  type StratNameRef,
  type StructureRef,
  type TaxonRef,
} from "~/checkin-editor";
import styles from "./checkin-editor.module.sass";

const h = hyper.styled(styles);

/** A record wrapped as the tag pickers' item, keeping the record to give back */
interface RefItem<R> extends PickerItem {
  ref: R;
}

const POPOVER = { minimal: true, matchTargetWidth: true };

// ---- Interval ----

export function IntervalPicker({
  value,
  onChange,
}: {
  value: IntervalRef | null;
  onChange: (value: IntervalRef | null) => void;
}) {
  const intervals = useIntervals();
  const items = useMemo<RefItem<IntervalRef>[]>(() => {
    if (intervals == null) return [];
    return Array.from(intervals.values())
      .filter((d: any) => d.int_id > 0)
      .sort((a: any, b: any) => a.t_age - b.t_age || a.b_age - b.b_age)
      .map((d: any) => ({
        id: d.int_id,
        name: d.name,
        color: d.color,
        description: `${d.int_type ?? ""} ${fmtAges(d.t_age, d.b_age)}`.trim(),
        ref: {
          int_id: d.int_id,
          name: d.name,
          color: d.color,
          b_age: d.b_age,
          t_age: d.t_age,
        },
      }));
  }, [intervals]);

  const picked = useMemo<RefItem<IntervalRef>[]>(() => {
    if (value == null) return [];
    const known = items.find((d) => d.id === value.int_id);
    return [
      known ?? {
        id: value.int_id,
        name: value.name,
        color: value.color,
        ref: value,
      },
    ];
  }, [value, items]);

  let placeholder = "Add age";
  if (intervals == null) placeholder = "Loading ages…";

  return h(TagPicker<RefItem<IntervalRef>>, {
    items,
    value: picked,
    multi: false,
    placeholder,
    searchPlaceholder: "Search geologic ages…",
    size: TagSize.Normal,
    className: "picker",
    onChange: (next) => onChange(next[0]?.ref ?? null),
  });
}

function fmtAges(t: number, b: number): string {
  if (t == null || b == null) return "";
  return `${t}–${b} Ma`;
}

// ---- Lithologies ----

/** Rockd stores a lithology's attributes as records; the picker speaks
 * attribute names, so the two are mapped here through the attribute
 * vocabulary. */
export function LithologyField({
  value,
  onChange,
}: {
  value: LithologyRef[];
  onChange: (value: LithologyRef[]) => void;
}) {
  const attributes = useLithAttributes();
  const attsByName = useMemo(() => {
    const index = new Map<string, any>();
    for (const att of attributes?.values() ?? []) index.set(att.name, att);
    return index;
  }, [attributes]);

  const pickerValue = useMemo<UnitLithologyValue[]>(
    () =>
      value.map((lith) => ({
        lith_id: lith.lith_id,
        name: lith.name,
        color: lith.color,
        atts: (lith.attributes ?? []).map((a) => a.name),
      })),
    [value]
  );

  function handleChange(next: UnitLithologyValue[]) {
    onChange(
      next.map((entry) => {
        const existing = value.find((l) => l.lith_id === entry.lith_id);
        const attributes = (entry.atts ?? []).map((name) => {
          const def = attsByName.get(name);
          const prior = existing?.attributes?.find((a) => a.name === name);
          return (
            prior ?? {
              lith_att_id: def?.lith_att_id ?? -1,
              name,
              type: def?.type,
            }
          );
        });
        return {
          ...(existing ?? {}),
          lith_id: entry.lith_id,
          name: entry.name,
          color: entry.color ?? existing?.color,
          attributes,
        };
      })
    );
  }

  return h(LithologyPicker, {
    value: pickerValue,
    onChange: handleChange,
    proportions: false,
    attributes: true,
    size: TagSize.Normal,
    className: "picker",
  });
}

// ---- Minerals ----

export function MineralPicker({
  value,
  onChange,
}: {
  value: MineralRef[];
  onChange: (value: MineralRef[]) => void;
}) {
  const minerals = useMinerals();
  const items = useMemo<RefItem<MineralRef>[]>(
    () =>
      (minerals.data ?? []).map((m) => ({
        id: m.mineral_id,
        name: m.mineral,
        description: m.mineral_type,
        ref: m,
      })),
    [minerals.data]
  );
  const picked = useMemo(
    () =>
      value.map((m) => ({
        id: m.mineral_id,
        name: m.mineral,
        description: m.mineral_type,
        ref: m,
      })),
    [value]
  );

  return h("div.picker-with-status", [
    h(TagPicker<RefItem<MineralRef>>, {
      items,
      value: picked,
      placeholder: "Add mineral",
      searchPlaceholder: "Search minerals…",
      size: TagSize.Normal,
      className: "picker",
      onChange: (next) => onChange(next.map((d) => d.ref)),
    }),
    h(VocabularyStatus, { loading: minerals.loading, error: minerals.error }),
  ]);
}

// ---- Structural feature ----

export function StructurePicker({
  value,
  onChange,
}: {
  value: StructureRef | null;
  onChange: (value: StructureRef | null) => void;
}) {
  const structures = useStructures();
  const items = useMemo<RefItem<StructureRef>[]>(
    () =>
      (structures.data ?? []).map((s) => ({
        id: s.structure_id,
        name: s.name,
        description: [s.class, s.structure_type].filter(Boolean).join(" · "),
        ref: s,
      })),
    [structures.data]
  );
  const picked = useMemo(() => {
    if (value == null) return [];
    return [{ id: value.structure_id, name: value.name, ref: value }];
  }, [value]);

  return h("div.picker-with-status", [
    h(TagPicker<RefItem<StructureRef>>, {
      items,
      value: picked,
      multi: false,
      placeholder: "Add feature",
      searchPlaceholder: "Search structural features…",
      size: TagSize.Normal,
      className: "picker",
      onChange: (next) => onChange(next[0]?.ref ?? null),
    }),
    h(VocabularyStatus, {
      loading: structures.loading,
      error: structures.error,
    }),
  ]);
}

function VocabularyStatus({
  loading,
  error,
}: {
  loading: boolean;
  error: Error | null;
}) {
  if (loading) return h(Spinner, { size: 14, className: "vocab-spinner" });
  if (error != null) {
    return h(
      "span.field-error",
      `Couldn't load the vocabulary (${error.message})`
    );
  }
  return null;
}

// ---- Stratigraphic name (remote search) ----

const StratNameSuggest = Suggest.ofType<StratNameRef>();

export function StratNamePicker({
  value,
  onChange,
  nearby = [],
}: {
  value: StratNameRef | null;
  onChange: (value: StratNameRef | null) => void;
  /** Names Macrostrat knows at the checkin's location, offered before a search */
  nearby?: StratNameRef[];
}) {
  const [query, setQuery] = useState("");
  const search = useStratNameSearch(query);

  let items = search.data ?? [];
  if (query.trim().length < 2) items = nearby;

  const renderItem: ItemRenderer<StratNameRef> = (
    item,
    { handleClick, modifiers }
  ) =>
    h(MenuItem, {
      key: item.strat_name_id,
      text: item.strat_name_long,
      label: fmtAges(item.t_age as number, item.b_age as number),
      active: modifiers.active,
      onClick: handleClick,
      roleStructure: "listoption",
    });

  return h("div.suggest-row", [
    h(StratNameSuggest, {
      items,
      query,
      onQueryChange: setQuery,
      selectedItem: value,
      onItemSelect: (item) => onChange(item),
      itemRenderer: renderItem,
      inputValueRenderer: (item) => item.strat_name_long,
      itemsEqual: "strat_name_id",
      noResults: h(MenuItem, {
        disabled: true,
        text: searchStatus(
          search.loading,
          query,
          "Type to search Macrostrat's names"
        ),
      }),
      popoverProps: POPOVER,
      inputProps: { placeholder: "Stratigraphic name" },
      fill: true,
      resetOnClose: true,
    }),
    h(ClearButton, { visible: value != null, onClick: () => onChange(null) }),
  ]);
}

// ---- Map unit (from the nearby geology) ----

const MapUnitSuggest = Suggest.ofType<MapUnitRef>();

export function MapUnitPicker({
  value,
  onChange,
  nearby,
  loading = false,
}: {
  value: MapUnitRef | null;
  onChange: (value: MapUnitRef | null) => void;
  nearby: MapUnitRef[];
  loading?: boolean;
}) {
  const [query, setQuery] = useState("");

  const renderItem: ItemRenderer<MapUnitRef> = (
    item,
    { handleClick, modifiers }
  ) =>
    h(MenuItem, {
      key: item.map_id,
      text: item.unit_name,
      label: [item.b_int_name, item.t_int_name].filter(Boolean).join("–"),
      active: modifiers.active,
      onClick: handleClick,
      roleStructure: "listoption",
    });

  let empty = "Set the checkin's location to see map units";
  if (loading) empty = "Looking up nearby map units…";
  else if (nearby.length > 0) empty = "No matching map unit";

  return h("div.suggest-row", [
    h(MapUnitSuggest, {
      items: nearby,
      query,
      onQueryChange: setQuery,
      selectedItem: value,
      onItemSelect: (item) => onChange(item),
      itemRenderer: renderItem,
      itemPredicate: (q, item) =>
        (item.unit_name ?? "").toLowerCase().includes(q.toLowerCase()),
      inputValueRenderer: (item) => item.unit_name,
      itemsEqual: "map_id",
      noResults: h(MenuItem, { disabled: true, text: empty }),
      popoverProps: POPOVER,
      inputProps: { placeholder: "Map unit (from the geologic map here)" },
      fill: true,
      resetOnClose: true,
    }),
    h(ClearButton, { visible: value != null, onClick: () => onChange(null) }),
  ]);
}

// ---- Taxa (remote search) ----

const TaxonMultiSelect = MultiSelect.ofType<TaxonRef>();

export function TaxonPicker({
  value,
  onChange,
}: {
  value: TaxonRef[];
  onChange: (value: TaxonRef[]) => void;
}) {
  const [query, setQuery] = useState("");
  const search = useTaxonSearch(query);

  const renderItem: ItemRenderer<TaxonRef> = (
    item,
    { handleClick, modifiers }
  ) =>
    h(MenuItem, {
      key: item.oid,
      text: h("span.taxon-option", [
        h("img.taxon-thumb", { src: `${PBDB_THUMB}${item.oid}`, alt: "" }),
        item.name,
      ]),
      label: String(item.rank ?? ""),
      active: modifiers.active,
      selected: value.some((t) => t.oid === item.oid),
      onClick: handleClick,
      roleStructure: "listoption",
    });

  function add(item: TaxonRef) {
    if (value.some((t) => t.oid === item.oid)) return;
    onChange([...value, item]);
    setQuery("");
  }

  return h(TaxonMultiSelect, {
    items: search.data ?? [],
    selectedItems: value,
    query,
    onQueryChange: setQuery,
    onItemSelect: add,
    onRemove: (item) => onChange(value.filter((t) => t.oid !== item.oid)),
    itemRenderer: renderItem,
    tagRenderer: (item) => item.name,
    itemsEqual: "oid",
    noResults: h(MenuItem, {
      disabled: true,
      text: searchStatus(
        search.loading,
        query,
        "Type to search the Paleobiology Database"
      ),
    }),
    popoverProps: POPOVER,
    placeholder: "Fossil taxa",
    resetOnSelect: true,
    fill: true,
  });
}

// ---- Shared ----

function ClearButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  if (!visible) return null;
  return h(Button, {
    icon: "cross",
    minimal: true,
    small: true,
    title: "Clear",
    "aria-label": "Clear",
    onClick,
  });
}

function searchStatus(loading: boolean, query: string, prompt: string): string {
  if (loading) return "Searching…";
  if (query.trim().length < 2) return prompt;
  return "No matches";
}
