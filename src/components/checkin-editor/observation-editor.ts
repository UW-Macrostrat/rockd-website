/**
 * A checkin's observations: a list of cards, each the app's observation
 * editor flattened onto one page — its four modules (rocks, fossils,
 * minerals, structure) as collapsible sections, then its photo and its own
 * location. Pure `value`/`onChange` over an `ObservationDraft`, so the same
 * editor can sit in a bulk table later.
 */
import {
  Alert,
  Button,
  FormGroup,
  NumericInput,
  Section,
  SectionCard,
  Switch,
  TextArea,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import { LocationMap } from "~/components/map-sidebar/location-map";
import {
  addObservationAtom,
  draftAtom,
  observationKey,
  originalAtom,
  removeObservationAtom,
  updateObservationAtom,
  useNearbyGeology,
  type CheckinDraft,
  type LngLat,
  type NearbyGeology,
  type ObservationDraft,
  type OrientationModule,
  type PhotoRef,
  type Loadable,
} from "~/checkin-editor";
import { PhotoField } from "./photo-field";
import {
  IntervalPicker,
  LithologyField,
  MapUnitPicker,
  MineralPicker,
  StratNamePicker,
  StructurePicker,
  TaxonPicker,
} from "./pickers";
import styles from "./checkin-editor.module.sass";

const h = hyper.styled(styles);

export function ObservationList() {
  const draft = useAtomValue(draftAtom);
  const original = useAtomValue(originalAtom);
  const add = useSetAtom(addObservationAtom);
  const update = useSetAtom(updateObservationAtom);
  const remove = useSetAtom(removeObservationAtom);
  // Offered first in the pickers, as the app does with its "nearby" lists
  const nearby = useNearbyGeology(draft?.position ?? null);
  if (draft == null) return null;

  return h("section.observations", [
    h("div.observations-header", [
      h("h2.section-title", `Observations (${draft.observations.length})`),
      h(
        Button,
        { icon: "add", small: true, onClick: () => add() },
        "Add observation"
      ),
    ]),
    h.if(draft.observations.length === 0)(
      "p.field-note",
      "An observation records the rocks, fossils, minerals or structure at this spot, with its own photo."
    ),
    draft.observations.map((obs, index) =>
      h(ObservationEditor, {
        key: observationKey(obs),
        index,
        value: obs,
        originalPhoto: storedPhoto(original, obs),
        personId: draft.person_id,
        checkinPosition: draft.position,
        nearby,
        onChange: (changes) => update(index, changes),
        onRemove: () => remove(index),
      })
    ),
  ]);
}

export interface ObservationEditorProps {
  index: number;
  value: ObservationDraft;
  /** The observation's photo as stored, to go back to when a chosen file is
   * discarded */
  originalPhoto?: PhotoRef | null;
  personId: number | null;
  checkinPosition: LngLat | null;
  nearby: Loadable<NearbyGeology>;
  onChange: (changes: Partial<ObservationDraft>) => void;
  onRemove: () => void;
}

export function ObservationEditor({
  index,
  value,
  originalPhoto = null,
  personId,
  checkinPosition,
  nearby,
  onChange,
  onRemove,
}: ObservationEditorProps) {
  const [confirming, setConfirming] = useState(false);
  const { rocks, fossils, minerals, orientation } = value;

  const setRocks = (changes: Partial<typeof rocks>) =>
    onChange({ rocks: { ...rocks, ...changes } });
  const setFossils = (changes: Partial<typeof fossils>) =>
    onChange({ fossils: { ...fossils, ...changes } });
  const setMinerals = (changes: Partial<typeof minerals>) =>
    onChange({ minerals: { ...minerals, ...changes } });
  const setOrientation = (changes: Partial<OrientationModule>) =>
    onChange({ orientation: { ...orientation, ...changes } });

  // Removing a stored observation deletes it on save; a blank new one is free
  function requestRemove() {
    if (value.obs_id != null) setConfirming(true);
    else onRemove();
  }

  return h("div.observation-card", [
    h("div.obs-header", [
      h("h3.obs-title", observationTitle(value, index)),
      h(Button, {
        icon: "trash",
        minimal: true,
        small: true,
        intent: "danger",
        title: "Remove observation",
        "aria-label": "Remove observation",
        onClick: requestRemove,
      }),
    ]),
    h(
      Alert,
      {
        isOpen: confirming,
        intent: "danger",
        icon: "trash",
        confirmButtonText: "Remove",
        cancelButtonText: "Keep",
        onConfirm: () => {
          setConfirming(false);
          onRemove();
        },
        onCancel: () => setConfirming(false),
      },
      "Remove this observation? It will be deleted from Rockd, with its photo, when the checkin is saved."
    ),
    h(
      ModuleSection,
      { title: "Rocks", icon: "layers", hasContent: rocksHaveContent(rocks) },
      [
        h(
          Labeled,
          { label: "Unit name" },
          h(StratNamePicker, {
            value: rocks.strat_name,
            onChange: (strat_name) => setRocks({ strat_name }),
            nearby: nearby.data?.strat_names ?? [],
          })
        ),
        h(
          Labeled,
          { label: "Map unit" },
          h(MapUnitPicker, {
            value: rocks.map_unit,
            onChange: (map_unit) => setRocks({ map_unit }),
            nearby: nearby.data?.map_units ?? [],
            loading: nearby.loading,
          })
        ),
        h(
          Labeled,
          { label: "Age" },
          h(IntervalPicker, {
            value: rocks.interval,
            onChange: (interval) => setRocks({ interval }),
          })
        ),
        h(
          Labeled,
          { label: "Lithologies" },
          h(LithologyField, {
            value: rocks.liths,
            onChange: (liths) => setRocks({ liths }),
          })
        ),
        h(Notes, {
          value: rocks.notes,
          onChange: (notes) => setRocks({ notes }),
        }),
      ]
    ),
    h(
      ModuleSection,
      {
        title: "Fossils",
        icon: "search-around",
        hasContent: fossilsHaveContent(fossils),
      },
      [
        h(
          Labeled,
          { label: "Taxa" },
          h(TaxonPicker, {
            value: fossils.taxa,
            onChange: (taxa) => setFossils({ taxa }),
          })
        ),
        h(Notes, {
          value: fossils.notes,
          onChange: (notes) => setFossils({ notes }),
        }),
      ]
    ),
    h(
      ModuleSection,
      {
        title: "Minerals",
        icon: "cube",
        hasContent: mineralsHaveContent(minerals),
      },
      [
        h(
          Labeled,
          { label: "Minerals" },
          h(MineralPicker, {
            value: minerals.minerals,
            onChange: (list) => setMinerals({ minerals: list }),
          })
        ),
        h(Notes, {
          value: minerals.notes,
          onChange: (notes) => setMinerals({ notes }),
        }),
      ]
    ),
    h(
      ModuleSection,
      {
        title: "Structure",
        icon: "compass",
        hasContent: orientationHasContent(orientation),
      },
      [
        h(OrientationFields, { value: orientation, onChange: setOrientation }),
        h(
          Labeled,
          { label: "Feature" },
          h(StructurePicker, {
            value: orientation.feature,
            onChange: (feature) => setOrientation({ feature }),
          })
        ),
        h(Notes, {
          value: orientation.notes,
          onChange: (notes) => setOrientation({ notes }),
        }),
      ]
    ),
    h("div.obs-extras", [
      h(PhotoField, {
        photo: value.photo,
        original: originalPhoto,
        personId,
        onChange: (photo) => onChange({ photo }),
      }),
      h(ObservationLocation, {
        position: value.position,
        checkinPosition,
        onChange: (position) => onChange({ position }),
      }),
    ]),
  ]);
}

// ---- Sections ----

/** A module's section: open when it has content, folded when it doesn't, so
 * a full observation reads at a glance and an empty one stays short. */
function ModuleSection({
  title,
  icon,
  hasContent,
  children,
}: {
  title: string;
  icon: any;
  hasContent: boolean;
  children: any;
}) {
  return h(
    Section,
    {
      title,
      icon,
      compact: true,
      collapsible: true,
      collapseProps: { defaultIsOpen: hasContent },
      className: "module-section",
      rightElement: h.if(hasContent)("span.module-badge", "has content"),
    },
    h(SectionCard, { className: "module-body" }, children)
  );
}

function Labeled({ label, children }: { label: string; children: any }) {
  return h(FormGroup, { label, className: "field" }, children);
}

function Notes({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return h(
    Labeled,
    { label: "Notes" },
    h(TextArea, {
      value,
      onChange: (e) => onChange(e.currentTarget.value),
      fill: true,
      autoResize: true,
      placeholder: "Notes",
    })
  );
}

// ---- Orientation ----

/** Strike and dip (with dip direction), trend and plunge, each with an
 * optional uncertainty — the app's compass fields, typed rather than
 * measured. */
function OrientationFields({
  value,
  onChange,
}: {
  value: OrientationModule;
  onChange: (changes: Partial<OrientationModule>) => void;
}) {
  return h("div.orientation-fields", [
    h("div.degrees-row", [
      h(Degrees, {
        label: "Strike",
        value: value.strike,
        max: 360,
        onChange: (strike) => onChange({ strike }),
      }),
      h(Degrees, {
        label: "Dip",
        value: value.dip,
        max: 90,
        onChange: (dip) => onChange({ dip }),
      }),
      h(Degrees, {
        label: "Dip direction",
        value: value.dip_dir,
        max: 360,
        onChange: (dip_dir) => onChange({ dip_dir }),
      }),
    ]),
    h("div.degrees-row.uncertainty", [
      h(Degrees, {
        label: "± strike",
        value: value.strikestd,
        max: 180,
        onChange: (strikestd) => onChange({ strikestd }),
      }),
      h(Degrees, {
        label: "± dip",
        value: value.dipstd,
        max: 90,
        onChange: (dipstd) => onChange({ dipstd }),
      }),
    ]),
    h("div.degrees-row", [
      h(Degrees, {
        label: "Trend",
        value: value.trend,
        max: 360,
        onChange: (trend) => onChange({ trend }),
      }),
      h(Degrees, {
        label: "Plunge",
        value: value.plunge,
        max: 90,
        onChange: (plunge) => onChange({ plunge }),
      }),
    ]),
    h("div.degrees-row.uncertainty", [
      h(Degrees, {
        label: "± trend",
        value: value.trendstd,
        max: 180,
        onChange: (trendstd) => onChange({ trendstd }),
      }),
      h(Degrees, {
        label: "± plunge",
        value: value.plungestd,
        max: 90,
        onChange: (plungestd) => onChange({ plungestd }),
      }),
    ]),
  ]);
}

function Degrees({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number | null;
  max: number;
  onChange: (value: number | null) => void;
}) {
  let shown: number | string = "";
  if (value != null) shown = value;
  return h(
    FormGroup,
    { label, className: "degrees-field" },
    h(NumericInput, {
      value: shown,
      min: 0,
      max,
      buttonPosition: "none",
      fill: true,
      placeholder: "°",
      allowNumericCharactersOnly: true,
      onValueChange: (n, text) => {
        if (text.trim() === "") onChange(null);
        else if (Number.isFinite(n)) onChange(n);
      },
    })
  );
}

// ---- Location ----

/** An observation's own position: off, it's the checkin's; on, a map to pick
 * from, starting where the checkin is. */
function ObservationLocation({
  position,
  checkinPosition,
  onChange,
}: {
  position: LngLat | null;
  checkinPosition: LngLat | null;
  onChange: (position: LngLat | null) => void;
}) {
  const pick = useCallback(
    (next: LngLat) =>
      onChange({
        lng: Math.round(next.lng * 1e5) / 1e5,
        lat: Math.round(next.lat * 1e5) / 1e5,
      }),
    [onChange]
  );

  function toggle(on: boolean) {
    if (!on) onChange(null);
    else onChange(checkinPosition ?? { lng: 0, lat: 0 });
  }

  let map = null;
  if (position != null) {
    map = h(
      "div.location-map-holder.small",
      h(LocationMap, {
        position,
        altitude: 20_000,
        onPick: pick,
        className: "location-map",
      })
    );
  }

  return h("div.obs-location", [
    h(Switch, {
      checked: position != null,
      onChange: (e) => toggle(e.currentTarget.checked),
      label: "Own location (differs from the checkin's)",
    }),
    map,
  ]);
}

/** The stored photo of the observation `obs` stands for, if it has one */
function storedPhoto(
  original: CheckinDraft | null,
  obs: ObservationDraft
): PhotoRef | null {
  if (original == null || obs.obs_id == null) return null;
  const stored = original.observations.find((o) => o.obs_id === obs.obs_id);
  return stored?.photo ?? null;
}

// ---- Content tests ----

function rocksHaveContent(r: ObservationDraft["rocks"]): boolean {
  return (
    r.strat_name != null ||
    r.map_unit != null ||
    r.interval != null ||
    r.liths.length > 0 ||
    r.notes.trim() !== ""
  );
}

function fossilsHaveContent(f: ObservationDraft["fossils"]): boolean {
  return f.taxa.length > 0 || f.notes.trim() !== "";
}

function mineralsHaveContent(m: ObservationDraft["minerals"]): boolean {
  return m.minerals.length > 0 || m.notes.trim() !== "";
}

function orientationHasContent(o: OrientationModule): boolean {
  return (
    o.strike != null ||
    o.dip != null ||
    o.trend != null ||
    o.plunge != null ||
    o.feature != null ||
    o.notes.trim() !== ""
  );
}

/** The app's observation title: its unit name, else its map unit, else a
 * number */
function observationTitle(obs: ObservationDraft, index: number): string {
  const name =
    obs.rocks.strat_name?.strat_name_long ?? obs.rocks.map_unit?.unit_name;
  if (name) return name;
  return `Observation ${index + 1}`;
}
