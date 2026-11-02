/**
 * A draft as `POST /protected/checkin` wants it. Mirrors the app's
 * `CheckinSyncService.buildMetaPayload`, which is the contract the route was
 * written against:
 *
 * - module objects are sent whole, with `{}` for an empty `strat_name`,
 *   `interval`, `map_unit` or `feature` (the route JSON-stringifies them and
 *   tests emptiness by key count — `null` would be stored as the string
 *   "null");
 * - `obs_id` / `checkin_id` are strings (the route strips `obs|` / `chk|`);
 * - a photo is the local file name for a new one, and absent otherwise. The
 *   route only touches `photo` when the value ends in `.jpg`, so an existing
 *   photo is kept by saying nothing about it.
 */
import type { CheckinDraft, ObservationDraft, PhotoRef } from "./types";

export interface CheckinPayload {
  checkin_id?: string;
  new_checkin_id?: string;
  person_id: number;
  token: string;
  notes: string;
  rating: number;
  lng: number;
  lat: number;
  private: boolean;
  status: 1 | 2;
  created: string;
  photo?: string;
  org_id?: number | null;
  observations: ObservationPayload[];
}

export interface ObservationPayload {
  obs_id?: string;
  new_obs_id?: string;
  lng?: number;
  lat?: number;
  photo?: string;
  rocks: Record<string, unknown>;
  minerals: Record<string, unknown>;
  orientation: Record<string, unknown>;
  fossils: Record<string, unknown>;
}

export function buildCheckinPayload(
  draft: CheckinDraft,
  personId: number,
  token: string
): CheckinPayload {
  if (draft.position == null) {
    throw new Error("A checkin needs a location before it can be saved");
  }
  const payload: CheckinPayload = {
    person_id: personId,
    token,
    notes: draft.notes.trim(),
    rating: draft.rating,
    lng: draft.position.lng,
    lat: draft.position.lat,
    private: draft.private,
    status: draft.private ? 2 : 1,
    // The route re-parses this with `new Date()`, so ISO is fine
    created: draft.created,
    observations: draft.observations.map(buildObservationPayload),
  };
  if (draft.checkin_id != null) payload.checkin_id = String(draft.checkin_id);
  else payload.new_checkin_id = draft.new_checkin_id;
  if (draft.org_id !== undefined) payload.org_id = draft.org_id;
  const photo = photoName(draft.photo);
  if (photo != null) payload.photo = photo;
  return payload;
}

export function buildObservationPayload(
  obs: ObservationDraft
): ObservationPayload {
  const payload: ObservationPayload = {
    rocks: {
      strat_name: obs.rocks.strat_name ?? {},
      liths: obs.rocks.liths ?? [],
      interval: obs.rocks.interval ?? {},
      map_unit: obs.rocks.map_unit ?? {},
      notes: obs.rocks.notes ?? "",
    },
    minerals: {
      minerals: obs.minerals.minerals ?? [],
      notes: obs.minerals.notes ?? "",
    },
    orientation: {
      strike: obs.orientation.strike,
      strikestd: obs.orientation.strikestd,
      dip: obs.orientation.dip,
      dipstd: obs.orientation.dipstd,
      dip_dir: obs.orientation.dip_dir,
      trend: obs.orientation.trend,
      trendstd: obs.orientation.trendstd,
      plunge: obs.orientation.plunge,
      plungestd: obs.orientation.plungestd,
      feature: obs.orientation.feature ?? {},
      notes: obs.orientation.notes ?? "",
    },
    fossils: {
      taxa: obs.fossils.taxa ?? [],
      notes: obs.fossils.notes ?? "",
    },
  };
  if (obs.obs_id != null) payload.obs_id = String(obs.obs_id);
  else payload.new_obs_id = obs.new_obs_id;
  if (obs.position != null) {
    payload.lng = obs.position.lng;
    payload.lat = obs.position.lat;
  }
  const photo = photoName(obs.photo);
  if (photo != null) payload.photo = photo;
  return payload;
}

function photoName(photo: PhotoRef | null): string | undefined {
  if (photo?.kind === "local") return photo.localId;
  return undefined;
}

/** Whether an observation records anything. The route skips an empty one
 * (`isEdited`), but a draft shouldn't carry blank cards to the server. */
export function observationHasContent(obs: ObservationDraft): boolean {
  const { rocks, minerals, orientation, fossils } = obs;
  return (
    obs.photo != null ||
    obs.position != null ||
    rocks.strat_name != null ||
    rocks.liths.length > 0 ||
    rocks.interval != null ||
    rocks.map_unit != null ||
    rocks.notes.trim() !== "" ||
    minerals.minerals.length > 0 ||
    minerals.notes.trim() !== "" ||
    orientation.strike != null ||
    orientation.dip != null ||
    orientation.trend != null ||
    orientation.plunge != null ||
    orientation.feature != null ||
    orientation.notes.trim() !== "" ||
    fossils.taxa.length > 0 ||
    fossils.notes.trim() !== ""
  );
}
