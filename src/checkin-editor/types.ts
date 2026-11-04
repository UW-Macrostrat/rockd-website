/**
 * The checkin editor's data model: a *draft* of one checkin, as the web
 * client edits it. It follows the Rockd app's `Checkin` / `Observation`
 * models (`rockd/src/app/_models`) and the shape `POST /protected/checkin`
 * accepts, with the device-specific parts (file paths, ngrx bookkeeping)
 * replaced by browser ones.
 *
 * A draft is plain data. Everything that edits it is a pure function from a
 * draft to a draft, so one editor and a bulk editor over many drafts use the
 * same operations.
 */

export interface LngLat {
  lng: number;
  lat: number;
}

/** A photo on a checkin or observation: one already on the server (its photo
 * id, as `/protected/checkins` reports it), or a file chosen in the browser
 * and not yet uploaded. */
export type PhotoRef = RemotePhoto | LocalPhoto;

export interface RemotePhoto {
  kind: "remote";
  /** The server's photo id, served by `/protected/image/…` */
  id: number;
}

export interface LocalPhoto {
  kind: "local";
  /** The file name sent as the photo's `local_id`, which the server echoes
   * back with the photo id it allocated. Always `<uuid>.jpg`: the route treats
   * a `.jpg` name as "a new photo is coming". */
  localId: string;
  file: File;
  /** An object URL for previewing the file */
  previewURL: string;
  /** What the file's EXIF said, if anything */
  exif?: PhotoExif | null;
}

export interface PhotoExif {
  /** `DateTimeOriginal`, as a local date */
  taken?: Date | null;
  /** The GPS position, signed by its hemisphere refs */
  position?: LngLat | null;
}

// ---- Observation modules ----
// The four modules of an observation, with the fields the API stores. The
// vocabulary items (`strat_name`, `liths`, …) are kept whole, as the app keeps
// them, so a stored observation reads back the same way it was written.

export interface StratNameRef {
  strat_name_id: number;
  strat_name: string;
  strat_name_long: string;
  rank?: string;
  concept_id?: number | null;
  b_age?: number;
  t_age?: number;
  [key: string]: unknown;
}

export interface LithologyRef {
  lith_id: number;
  name: string;
  color?: string;
  type?: string;
  class?: string;
  attributes?: LithAttributeRef[];
  [key: string]: unknown;
}

export interface LithAttributeRef {
  lith_att_id: number;
  name: string;
  type?: string;
}

export interface IntervalRef {
  int_id: number;
  name: string;
  color?: string;
  b_age?: number;
  t_age?: number;
  [key: string]: unknown;
}

export interface MapUnitRef {
  map_id: number;
  unit_name: string;
  strat_name?: string;
  lith?: string;
  descrip?: string;
  b_int_name?: string;
  t_int_name?: string;
  [key: string]: unknown;
}

export interface MineralRef {
  mineral_id: number;
  mineral: string;
  mineral_type?: string;
  formula?: string;
  formula_tags?: string;
  [key: string]: unknown;
}

export interface TaxonRef {
  /** The PBDB taxon number */
  oid: number;
  name: string;
  rank?: string | number;
  [key: string]: unknown;
}

export interface StructureRef {
  structure_id: number;
  name: string;
  structure_type?: string;
  group?: string;
  class?: string;
}

export interface RocksModule {
  strat_name: StratNameRef | null;
  liths: LithologyRef[];
  interval: IntervalRef | null;
  map_unit: MapUnitRef | null;
  notes: string;
}

export interface MineralsModule {
  minerals: MineralRef[];
  notes: string;
}

export interface OrientationModule {
  strike: number | null;
  strikestd: number | null;
  dip: number | null;
  dipstd: number | null;
  dip_dir: number | null;
  trend: number | null;
  trendstd: number | null;
  plunge: number | null;
  plungestd: number | null;
  feature: StructureRef | null;
  notes: string;
}

export interface FossilsModule {
  taxa: TaxonRef[];
  notes: string;
}

export interface ObservationDraft {
  /** Set for an observation already on the server */
  obs_id?: number;
  /** A client id for a new observation (the route stores it as `local_id`) */
  new_obs_id?: string;
  position: LngLat | null;
  photo: PhotoRef | null;
  rocks: RocksModule;
  minerals: MineralsModule;
  orientation: OrientationModule;
  fossils: FossilsModule;
}

export interface CheckinDraft {
  /** Set for a checkin already on the server */
  checkin_id?: number;
  /** A client id for a new checkin. The route upserts on it (`ON CONFLICT
   * (local_id)`), so a retried create can't make a duplicate — the bug that
   * filled the dev database with repeats (see the feed note). */
  new_checkin_id: string;
  person_id: number | null;
  notes: string;
  rating: number;
  position: LngLat | null;
  /** The place name, as the server last reported it (read-only here) */
  near?: string | null;
  /** When the checkin was observed, as an ISO date-time */
  created: string;
  private: boolean;
  /** `undefined` leaves any organization assignment alone; `null` detaches;
   * a number attaches or moves. The route's three cases. */
  org_id?: number | null;
  photo: PhotoRef | null;
  observations: ObservationDraft[];
}

// ---- Blank values ----

export function blankRocks(): RocksModule {
  return {
    strat_name: null,
    liths: [],
    interval: null,
    map_unit: null,
    notes: "",
  };
}

export function blankMinerals(): MineralsModule {
  return { minerals: [], notes: "" };
}

export function blankOrientation(): OrientationModule {
  return {
    strike: null,
    strikestd: null,
    dip: null,
    dipstd: null,
    dip_dir: null,
    trend: null,
    trendstd: null,
    plunge: null,
    plungestd: null,
    feature: null,
    notes: "",
  };
}

export function blankFossils(): FossilsModule {
  return { taxa: [], notes: "" };
}

export function newObservation(): ObservationDraft {
  return {
    new_obs_id: newClientId(),
    position: null,
    photo: null,
    rocks: blankRocks(),
    minerals: blankMinerals(),
    orientation: blankOrientation(),
    fossils: blankFossils(),
  };
}

export function newCheckin(personId: number | null): CheckinDraft {
  return {
    new_checkin_id: newClientId(),
    person_id: personId,
    notes: "",
    rating: 0,
    position: null,
    created: new Date().toISOString(),
    private: false,
    photo: null,
    observations: [],
  };
}

/** A client id for a new record, as the app issues them. */
export function newClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID != null) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** The id a draft is addressed by: the server's, or the client's until then */
export function draftKey(draft: CheckinDraft): string {
  if (draft.checkin_id != null) return String(draft.checkin_id);
  return draft.new_checkin_id;
}

// ---- From the API ----

/** `/protected/checkins` reports a checkin's modules as `{}` when empty and
 * its `liths` as `[]` or `{}`; the draft wants the full shape. */
export function draftFromAPI(checkin: any): CheckinDraft {
  const observations: ObservationDraft[] = (checkin.observations ?? []).map(
    observationFromAPI
  );
  return {
    checkin_id: Number(checkin.checkin_id),
    new_checkin_id: newClientId(),
    person_id: checkin.person_id ?? null,
    notes: checkin.notes ?? "",
    rating: Number(checkin.rating ?? 0),
    position: positionFromAPI(checkin),
    near: checkin.near ?? null,
    created: isoDateFromAPI(checkin.created),
    private: checkin.status === 2,
    org_id: checkin.org_id ?? null,
    photo: photoFromAPI(checkin.photo),
    observations,
  };
}

export function observationFromAPI(obs: any): ObservationDraft {
  const rocks = obs.rocks ?? {};
  const minerals = obs.minerals ?? {};
  const orientation = obs.orientation ?? {};
  const fossils = obs.fossils ?? {};
  return {
    obs_id: Number(obs.obs_id),
    position: positionFromAPI(obs),
    photo: photoFromAPI(obs.photo),
    rocks: {
      strat_name: emptyToNull(rocks.strat_name),
      liths: asArray(rocks.liths),
      interval: emptyToNull(rocks.interval),
      map_unit: emptyToNull(rocks.map_unit),
      notes: rocks.notes ?? "",
    },
    minerals: {
      minerals: asArray(minerals.minerals),
      notes: minerals.notes ?? "",
    },
    orientation: {
      ...blankOrientation(),
      ...numericFields(orientation),
      feature: emptyToNull(orientation.feature),
      notes: orientation.notes ?? "",
    },
    fossils: {
      taxa: asArray(fossils.taxa),
      notes: fossils.notes ?? "",
    },
  };
}

function positionFromAPI(record: any): LngLat | null {
  const lng = Number(record?.lng);
  const lat = Number(record?.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  // The app's "no location" sentinel, and an empty geometry
  if (lng === -999 || lat === -999) return null;
  if (lng === 0 && lat === 0) return null;
  return { lng, lat };
}

function photoFromAPI(photo: unknown): PhotoRef | null {
  const id = Number(photo);
  if (photo == null || !Number.isFinite(id) || id === 0) return null;
  return { kind: "remote", id };
}

/** The route formats `created` as "Month DD, YYYY" (no time). */
function isoDateFromAPI(created: unknown): string {
  if (typeof created !== "string" || created === "") {
    return new Date().toISOString();
  }
  const date = new Date(created);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function emptyToNull<T extends object>(value: T | null | undefined): T | null {
  if (value == null || typeof value !== "object") return null;
  if (Object.keys(value).length === 0) return null;
  return value;
}

function asArray<T>(value: T[] | unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

const ORIENTATION_NUMBERS = [
  "strike",
  "strikestd",
  "dip",
  "dipstd",
  "dip_dir",
  "trend",
  "trendstd",
  "plunge",
  "plungestd",
] as const;

function numericFields(orientation: any): Partial<OrientationModule> {
  const out: Partial<OrientationModule> = {};
  for (const key of ORIENTATION_NUMBERS) {
    const value = orientation?.[key];
    if (value == null || value === "") continue;
    const n = Number(value);
    if (Number.isFinite(n)) out[key] = n;
  }
  return out;
}
