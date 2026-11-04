/**
 * The editor's save column: what's changed, what's missing, Save, and the
 * save's progress through its two phases (the checkin, then its photos) —
 * the app's sync modal, without the modal. Also Delete, for a stored checkin.
 */
import {
  Alert,
  AnchorButton,
  Button,
  Callout,
  ProgressBar,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import {
  deleteCheckin,
  draftAtom,
  errorsAtom,
  isDirtyAtom,
  isSavingAtom,
  isValid,
  originalAtom,
  resetDraftAtom,
  saveStateAtom,
  showErrorsAtom,
  type SyncProgress,
} from "~/checkin-editor";
import styles from "./checkin-editor.module.sass";

const h = hyper.styled(styles);

export interface SavePanelProps {
  token: string;
  onSave: () => Promise<void>;
  onRetryPhotos: () => Promise<void>;
  onDeleted: () => void;
}

export function SavePanel({
  token,
  onSave,
  onRetryPhotos,
  onDeleted,
}: SavePanelProps) {
  const draft = useAtomValue(draftAtom);
  const original = useAtomValue(originalAtom);
  const dirty = useAtomValue(isDirtyAtom);
  const saving = useAtomValue(isSavingAtom);
  const errors = useAtomValue(errorsAtom);
  const showErrors = useAtomValue(showErrorsAtom);
  const save = useAtomValue(saveStateAtom);
  const reset = useSetAtom(resetDraftAtom);
  const setShowErrors = useSetAtom(showErrorsAtom);
  if (draft == null) return null;

  const isNew = draft.checkin_id == null;
  const valid = isValid(errors);
  const errorList = Object.values(errors);

  let status: string = "No unsaved changes";
  if (isNew) status = "Not yet saved to Rockd";
  else if (dirty) status = "Unsaved changes";

  let canSave = dirty || isNew;
  if (saving) canSave = false;

  function handleSave() {
    setShowErrors(true);
    if (!valid) return;
    onSave();
  }

  let viewLink = null;
  if (!isNew) {
    viewLink = h(
      AnchorButton,
      {
        minimal: true,
        small: true,
        icon: "eye-open",
        href: `/checkin/${draft.checkin_id}`,
      },
      "View checkin"
    );
  }

  return h("div.save-panel", [
    h("div.save-status", status),
    h("div.save-actions", [
      h(
        Button,
        {
          intent: "primary",
          icon: "cloud-upload",
          loading: saving,
          disabled: !canSave,
          onClick: handleSave,
        },
        "Save to Rockd"
      ),
      h.if(dirty && original != null && !saving)(
        Button,
        { minimal: true, icon: "undo", onClick: () => reset(original!) },
        "Discard changes"
      ),
      viewLink,
    ]),
    h.if(showErrors && errorList.length > 0)(
      Callout,
      {
        intent: "warning",
        icon: "warning-sign",
        compact: true,
        title: "Before saving",
      },
      h(
        "ul.error-list",
        errorList.map((e) => h("li", { key: e }, e))
      )
    ),
    h(SaveProgress, { progress: save.progress }),
    h(SaveOutcome, { onRetryPhotos }),
    h.if(!isNew)(DeleteCheckin, {
      checkinId: draft.checkin_id!,
      token,
      onDeleted,
      disabled: saving,
    }),
  ]);
}

function SaveProgress({ progress }: { progress: SyncProgress }) {
  const { phase, photosDone, photosTotal, retry } = progress;
  if (phase !== "metadata" && phase !== "photos") return null;

  let text = "Saving the checkin…";
  let value: number | undefined = undefined;
  if (phase === "photos") {
    text = `Uploading photo ${Math.min(
      photosDone + 1,
      photosTotal
    )} of ${photosTotal}…`;
    value = photosTotal === 0 ? 1 : photosDone / photosTotal;
  }
  let retryNote = null;
  if (retry != null) {
    retryNote = h(
      "span.field-note",
      `Retrying (${retry.attempt} of ${retry.maxAttempts}) in ${Math.round(
        retry.delayMs / 1000
      )} s…`
    );
  }

  return h("div.save-progress", [
    h("span", text),
    h(ProgressBar, { value, intent: "primary", stripes: value == null }),
    retryNote,
  ]);
}

function SaveOutcome({
  onRetryPhotos,
}: {
  onRetryPhotos: () => Promise<void>;
}) {
  const save = useAtomValue(saveStateAtom);
  const { phase } = save.progress;

  if (phase === "done") {
    let xp = null;
    if (save.xp != null && save.xp > 0) xp = ` You earned ${save.xp} XP.`;
    return h(
      Callout,
      { intent: "success", icon: "tick", compact: true },
      `Saved to Rockd.${xp ?? ""}`
    );
  }

  if (phase === "failed" && save.error != null) {
    let retry = null;
    if (save.failedPhotos.length > 0) {
      retry = h(
        Button,
        { small: true, icon: "repeat", onClick: onRetryPhotos },
        "Retry photo upload"
      );
    }
    return h(
      Callout,
      { intent: "danger", icon: "error", compact: true, title: "Save failed" },
      [h("p", save.error.message), retry]
    );
  }

  return null;
}

/** Deleting a stored checkin, after confirmation — the app's delete modal. */
function DeleteCheckin({
  checkinId,
  token,
  onDeleted,
  disabled,
}: {
  checkinId: number;
  token: string;
  onDeleted: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteCheckin(checkinId, token);
      setOpen(false);
      onDeleted();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't delete the checkin");
    } finally {
      setBusy(false);
    }
  }

  return h("div.delete-section", [
    h(
      Button,
      {
        minimal: true,
        intent: "danger",
        icon: "trash",
        disabled,
        onClick: () => setOpen(true),
      },
      "Delete checkin"
    ),
    h.if(error != null)("span.field-error", error),
    h(
      Alert,
      {
        isOpen: open,
        intent: "danger",
        icon: "trash",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        loading: busy,
        onConfirm: confirm,
        onCancel: () => setOpen(false),
      },
      "Delete this checkin from Rockd? Its observations and photos go with it. This can't be undone."
    ),
  ]);
}
