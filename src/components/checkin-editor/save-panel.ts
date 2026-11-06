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
  const dirty = useAtomValue(isDirtyAtom);
  const saving = useAtomValue(isSavingAtom);
  const errors = useAtomValue(errorsAtom);
  const showErrors = useAtomValue(showErrorsAtom);
  const save = useAtomValue(saveStateAtom);
  const setShowErrors = useSetAtom(showErrorsAtom);
  if (draft == null) return null;

  const isNew = draft.checkin_id == null;
  const valid = isValid(errors);
  const errorList = Object.values(errors);

  // The status line's text, and its dot: green when the server has it all,
  // amber with edits pending, grey before the first save
  let status: string = "No unsaved changes";
  let tone = "saved";
  if (isNew) {
    status = "Not yet saved to Rockd";
    tone = "new";
  } else if (dirty) {
    status = "Unsaved changes";
    tone = "dirty";
  }

  let canSave = dirty || isNew;
  if (saving) canSave = false;

  function handleSave() {
    setShowErrors(true);
    if (!valid) return;
    onSave();
  }

  // In a new tab, so the editor (and any unsaved edits) stays open
  let viewLink = null;
  if (!isNew) {
    viewLink = h(
      AnchorButton,
      {
        key: "view",
        outlined: true,
        fill: true,
        icon: "eye-open",
        rightIcon: "share",
        href: `/checkin/${draft.checkin_id}`,
        target: "_blank",
        rel: "noopener",
      },
      "View checkin"
    );
  }

  // Where the checkin stands, then every action in one stack: Save, View
  // checkin and Delete checkin, one under the other
  return h("div.save-panel", [
    h(`div.save-status.${tone}`, status),
    h("div.save-actions", [
      h(
        Button,
        {
          key: "save",
          intent: "primary",
          icon: "cloud-upload",
          fill: true,
          loading: saving,
          disabled: !canSave,
          onClick: handleSave,
        },
        "Save to Rockd"
      ),
      viewLink,
      h.if(!isNew)(DeleteCheckin, {
        key: "delete",
        checkinId: draft.checkin_id!,
        token,
        onDeleted,
        disabled: saving,
      }),
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
        outlined: true,
        fill: true,
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
