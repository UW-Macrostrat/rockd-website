/**
 * What a checkin needs before it can be saved — the app's three checks
 * (`getCheckinErrors` in `checkin.page.ts`): a description, a star rating, and
 * a real location. Field-keyed, so a form can mark the field as well as list
 * the problems.
 */
import type { CheckinDraft } from "./types";

export type CheckinField = "notes" | "rating" | "position" | "created";

export type CheckinErrors = Partial<Record<CheckinField, string>>;

export function validateCheckin(draft: CheckinDraft): CheckinErrors {
  const errors: CheckinErrors = {};
  if (draft.notes.trim() === "") {
    errors.notes = "Describe the outcrop";
  }
  if (!(draft.rating >= 1 && draft.rating <= 5)) {
    errors.rating = "Give the outcrop a star rating";
  }
  if (!hasLocation(draft)) {
    errors.position = "Pick the checkin's location";
  }
  if (Number.isNaN(new Date(draft.created).getTime())) {
    errors.created = "Enter a valid date";
  }
  return errors;
}

export function hasLocation(draft: CheckinDraft): boolean {
  const pos = draft.position;
  if (pos == null) return false;
  if (!Number.isFinite(pos.lng) || !Number.isFinite(pos.lat)) return false;
  // Null Island is what a failed fix reads as
  if (Math.round(pos.lng) === 0 && Math.round(pos.lat) === 0) return false;
  return Math.abs(pos.lat) <= 90 && Math.abs(pos.lng) <= 180;
}

export function isValid(errors: CheckinErrors): boolean {
  return Object.keys(errors).length === 0;
}
