/**
 * The checkin's own fields — what the app's edit page asks for: a
 * description, a star rating, when it was observed, whether it's private,
 * its organization, its location and its photo. Each is a small controlled
 * field writing to the editor's draft atom.
 */
import {
  Button,
  Callout,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Switch,
  TextArea,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { LocationMap } from "~/components/map-sidebar/location-map";
import {
  draftAtom,
  errorsAtom,
  originalAtom,
  fetchMyOrganizations,
  fetchPlaceName,
  hasLocation,
  setCheckinPhotoAtom,
  showErrorsAtom,
  updateCheckinAtom,
  type CheckinDraft,
  type LngLat,
  type PhotoExif,
} from "~/checkin-editor";
import { PhotoField } from "./photo-field";
import styles from "./checkin-editor.module.sass";

const h = hyper.styled(styles);

export function CheckinFields({ token }: { token: string }) {
  const draft = useAtomValue(draftAtom);
  const original = useAtomValue(originalAtom);
  const update = useSetAtom(updateCheckinAtom);
  const setPhoto = useSetAtom(setCheckinPhotoAtom);
  const errors = useAtomValue(errorsAtom);
  const showErrors = useAtomValue(showErrorsAtom);
  const [exif, setExif] = useState<PhotoExif | null>(null);
  if (draft == null) return null;

  const shown = (field: keyof typeof errors) => {
    if (!showErrors) return undefined;
    return errors[field];
  };

  // Three groups, each answering one question in the order a geologist
  // records it: what's here, when and who it's shared with, and where. Every
  // control has its label above it, on one grid, so the eye runs down a
  // single left edge.
  return h("div.checkin-fields", [
    h(FieldSection, { title: "Outcrop" }, [
      h(
        Field,
        {
          label: "Description",
          error: shown("notes"),
          required: true,
          helper: "The first line becomes the checkin's title.",
        },
        h(TextArea, {
          value: draft.notes,
          onChange: (e) => update({ notes: e.currentTarget.value }),
          placeholder:
            "e.g. Cross-bedded sandstone along the creek, with ripple marks near the base",
          fill: true,
          autoResize: true,
          className: "description-input",
          intent: intentFor(shown("notes")),
        })
      ),
    ]),
    h(FieldSection, { title: "Details" }, [
      h("div.field-grid", [
        h(
          Field,
          { label: "Rating", error: shown("rating"), required: true },
          h(RatingInput, {
            value: draft.rating,
            onChange: (rating) => update({ rating }),
          })
        ),
        h(
          Field,
          { label: "Observed", error: shown("created") },
          h(InputGroup, {
            type: "datetime-local",
            value: toLocalInput(draft.created),
            onChange: (e) =>
              update({ created: fromLocalInput(e.currentTarget.value) }),
            fill: true,
            className: "datetime-input",
            intent: intentFor(shown("created")),
          })
        ),
        h(
          Field,
          { label: "Visibility" },
          h(Switch, {
            checked: draft.private,
            onChange: (e) => update({ private: e.currentTarget.checked }),
            label: "Private — only you can see it",
            className: "private-switch",
          })
        ),
        h(OrganizationField, { draft, token, update }),
      ]),
    ]),
    h(FieldSection, { title: "Location", required: true }, [
      h(LocationField, {
        position: draft.position,
        near: draft.near ?? null,
        error: shown("position"),
        onChange: (position, near) => update({ position, near }),
      }),
    ]),
    h(PhotoField, {
      photo: draft.photo,
      // Discarding a chosen file goes back to the stored photo, if any
      original: original?.photo ?? null,
      personId: draft.person_id,
      onChange: setPhoto,
      onExif: (data) => setExif(data),
    }),
    h(ExifSuggestion, {
      exif,
      draft,
      onApply: (changes) => {
        update(changes);
        setExif(null);
      },
      onDismiss: () => setExif(null),
    }),
  ]);
}

// ---- Pieces ----

/** A titled group of fields, set off from the next by a rule */
function FieldSection({
  title,
  required = false,
  children,
}: {
  title: string;
  required?: boolean;
  children: any;
}) {
  return h("section.field-section", [
    h("h3.field-section-title", [
      title,
      h.if(required)("span.field-section-required", " (required)"),
    ]),
    children,
  ]);
}

/** A labelled control. An error replaces the helper text under it. */
function Field({
  label,
  error,
  helper,
  required = false,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: any;
}) {
  let helperText = null;
  if (helper != null) helperText = h("span.field-note", helper);
  if (error != null) helperText = h("span.field-error", error);
  let labelInfo = null;
  if (required) labelInfo = "(required)";
  return h(
    FormGroup,
    {
      label,
      labelInfo,
      helperText,
      intent: intentFor(error),
      className: "field",
    },
    children
  );
}

function intentFor(error: string | undefined): "danger" | "none" {
  if (error != null) return "danger";
  return "none";
}

const STARS = [1, 2, 3, 4, 5];

/** The app's five-star rating, as clickable stars. Clicking the current
 * rating clears it. */
export function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return h(
    "div.rating-input",
    { role: "radiogroup", "aria-label": "Rating" },
    STARS.map((star) => {
      let icon: "star" | "star-empty" = "star-empty";
      if (star <= value) icon = "star";
      let next = star;
      if (star === value) next = 0;
      return h(Button, {
        key: star,
        icon,
        minimal: true,
        className: "star-button",
        role: "radio",
        "aria-checked": star === value,
        "aria-label": `${star} of 5`,
        onClick: () => onChange(next),
      });
    })
  );
}

function OrganizationField({
  draft,
  token,
  update,
}: {
  draft: CheckinDraft;
  token: string;
  update: (changes: Partial<CheckinDraft>) => void;
}) {
  const orgs = useMyOrganizations(token);
  // Nothing to choose between
  if (orgs == null || orgs.length === 0) return null;

  const options = [
    { value: "", label: "No organization" },
    ...orgs.map((org) => ({ value: String(org.id), label: org.name })),
  ];
  let current = "";
  if (draft.org_id != null) current = String(draft.org_id);

  return h(
    Field,
    { label: "Organization" },
    h(HTMLSelect, {
      options,
      fill: true,
      value: current,
      onChange: (e) => {
        const raw = e.currentTarget.value;
        let org_id: number | null = null;
        if (raw !== "") org_id = Number(raw);
        update({ org_id });
      },
    })
  );
}

function useMyOrganizations(token: string) {
  const [orgs, setOrgs] = useState<
    { id: number; name: string; role: string }[] | null
  >(null);
  useEffect(() => {
    const controller = new AbortController();
    fetchMyOrganizations(token, controller.signal)
      .then((rows) =>
        setOrgs(rows.filter((o) => o.role === "member" || o.role === "admin"))
      )
      .catch(() => setOrgs([]));
    return () => controller.abort();
  }, [token]);
  return orgs;
}

// ---- Location ----

interface LocationFieldProps {
  position: LngLat | null;
  near: string | null;
  error?: string;
  onChange: (position: LngLat | null, near: string | null) => void;
}

/** Where the checkin is: a map to click (the pin moves), coordinates to type,
 * and the browser's location — the app's "adjust location" sheet and its GPS. */
function LocationField({
  position,
  near,
  error,
  onChange,
}: LocationFieldProps) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const place = usePlaceName(position, near);

  const pick = useCallback(
    (next: LngLat) =>
      onChange({ lng: round(next.lng), lat: round(next.lat) }, null),
    [onChange]
  );

  function locate() {
    if (typeof navigator === "undefined" || navigator.geolocation == null) {
      setLocateError("This browser can't report a location.");
      return;
    }
    setLocateError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        pick({ lng: pos.coords.longitude, lat: pos.coords.latitude });
      },
      (err) => {
        setLocating(false);
        setLocateError(err.message ?? "Couldn't get your location.");
      }
    );
  }

  function setCoordinate(key: "lat" | "lng", raw: string) {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return;
    const base = position ?? { lng: 0, lat: 0 };
    onChange({ ...base, [key]: n }, null);
  }

  let placeLine = "Click the map, enter coordinates, or use your location.";
  if (place != null) placeLine = `Near ${place}`;

  let lat = "";
  let lng = "";
  if (position != null) {
    lat = String(position.lat);
    lng = String(position.lng);
  }

  // The map, and beside it the same place as numbers: labelled coordinates,
  // the browser's position, and where the pin is
  return h("div.location-field", [
    // The `/checkin/:id` page's map: square, at its default regional view
    h(
      "div.location-map-holder.square",
      h(LocationMap, {
        position,
        onPick: pick,
        className: "location-map",
      })
    ),
    h("div.location-controls", [
      h(
        Field,
        { label: "Latitude" },
        h(InputGroup, {
          type: "number",
          step: "any",
          placeholder: "e.g. 43.0731",
          value: lat,
          fill: true,
          className: "coordinate-input",
          onChange: (e) => setCoordinate("lat", e.currentTarget.value),
        })
      ),
      h(
        Field,
        { label: "Longitude" },
        h(InputGroup, {
          type: "number",
          step: "any",
          placeholder: "e.g. -89.4012",
          value: lng,
          fill: true,
          className: "coordinate-input",
          onChange: (e) => setCoordinate("lng", e.currentTarget.value),
        })
      ),
      h(
        Button,
        {
          icon: "locate",
          outlined: true,
          fill: true,
          loading: locating,
          onClick: locate,
        },
        "Use my location"
      ),
      h("span.field-note", placeLine),
      h.if(locateError != null)("span.field-error", locateError),
      h.if(error != null)("span.field-error", error),
    ]),
  ]);
}

/** The server's place name for a position, as it labels checkins: the one
 * loaded with the checkin until the pin moves, then looked up. */
function usePlaceName(
  position: LngLat | null,
  loaded: string | null
): string | null {
  const [place, setPlace] = useState<string | null>(loaded);
  useEffect(() => {
    if (loaded != null) {
      setPlace(loaded);
      return;
    }
    if (position == null || !hasLocation({ position } as CheckinDraft)) {
      setPlace(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchPlaceName(position, controller.signal)
        .then(setPlace)
        .catch(() => setPlace(null));
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position?.lat, position?.lng, loaded]);
  return place;
}

/** Five decimals: about a metre, and past any Rockd dataset's resolution */
function round(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

// ---- EXIF ----

/** What a just-chosen photo's EXIF offers the checkin — its position and the
 * date it was taken — as the app's EXIF prompt does. Shown only where it
 * would change something. */
function ExifSuggestion({
  exif,
  draft,
  onApply,
  onDismiss,
}: {
  exif: PhotoExif | null;
  draft: CheckinDraft;
  onApply: (changes: Partial<CheckinDraft>) => void;
  onDismiss: () => void;
}) {
  if (exif == null) return null;
  const position = exif.position ?? null;
  const taken = exif.taken ?? null;
  const offersPosition =
    position != null && !samePosition(position, draft.position);
  const offersDate =
    taken != null && !sameMinute(taken, new Date(draft.created));
  if (!offersPosition && !offersDate) return null;

  const parts: string[] = [];
  if (offersPosition) {
    parts.push(`at ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`);
  }
  if (offersDate) parts.push(`on ${taken.toLocaleString()}`);

  const buttons = [];
  if (offersPosition) {
    buttons.push(
      h(
        Button,
        {
          key: "pos",
          small: true,
          icon: "map-marker",
          onClick: () => onApply({ position, near: null }),
        },
        "Use its location"
      )
    );
  }
  if (offersDate) {
    buttons.push(
      h(
        Button,
        {
          key: "date",
          small: true,
          icon: "calendar",
          onClick: () => onApply({ created: taken.toISOString() }),
        },
        "Use its date"
      )
    );
  }
  if (offersPosition && offersDate) {
    buttons.push(
      h(
        Button,
        {
          key: "both",
          small: true,
          intent: "primary",
          onClick: () =>
            onApply({ position, near: null, created: taken.toISOString() }),
        },
        "Use both"
      )
    );
  }
  buttons.push(
    h(
      Button,
      { key: "no", small: true, minimal: true, onClick: onDismiss },
      "Ignore"
    )
  );

  return h(
    Callout,
    {
      icon: "camera",
      intent: "primary",
      compact: true,
      className: "exif-callout",
    },
    [
      h("span", `This photo was taken ${parts.join(" ")}.`),
      h("div.exif-actions", buttons),
    ]
  );
}

function samePosition(a: LngLat, b: LngLat | null): boolean {
  if (b == null) return false;
  return Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lng - b.lng) < 1e-4;
}

function sameMinute(a: Date, b: Date): boolean {
  if (Number.isNaN(b.getTime())) return false;
  return Math.abs(a.getTime() - b.getTime()) < 60_000;
}

// ---- Dates ----

/** An ISO instant as the `datetime-local` input's local "YYYY-MM-DDTHH:mm" */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}
