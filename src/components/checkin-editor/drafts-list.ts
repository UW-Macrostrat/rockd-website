/**
 * The edits kept in this browser and not yet saved — the web's "Unsynced"
 * list. Each links back into the editor; Discard forgets it.
 */
import { Button, Card, NonIdealState } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useEffect, useState } from "react";
import { clearDraft, listDrafts, type StoredDraft } from "~/checkin-editor";
import styles from "./checkin-editor.module.sass";

const h = hyper.styled(styles);

export function DraftsList() {
  const [drafts, setDrafts] = useState<
    { key: string; stored: StoredDraft }[] | null
  >(null);
  useEffect(() => setDrafts(listDrafts()), []);
  if (drafts == null) return null;

  if (drafts.length === 0) {
    return h(NonIdealState, {
      icon: "cloud-upload",
      title: "Nothing unsaved",
      description:
        "Edits you make to checkins are kept here until they're saved to Rockd.",
    });
  }

  function discard(key: string) {
    clearDraft(key);
    setDrafts(listDrafts());
  }

  return h(
    "div.drafts-list",
    drafts.map(({ key, stored }) =>
      h(DraftRow, { key, draftKey: key, stored, onDiscard: () => discard(key) })
    )
  );
}

function DraftRow({
  draftKey,
  stored,
  onDiscard,
}: {
  draftKey: string;
  stored: StoredDraft;
  onDiscard: () => void;
}) {
  const { draft, savedAt, droppedPhotos } = stored;
  let title = draft.notes.trim().split(/\n+/)[0];
  if (!title) title = "Untitled checkin";

  let href = `/dev/checkin/new?draft=${encodeURIComponent(draftKey)}`;
  let kind = "New checkin";
  if (draft.checkin_id != null) {
    href = `/dev/checkin/${draft.checkin_id}`;
    kind = `Edits to checkin ${draft.checkin_id}`;
  }

  let photos = null;
  if (droppedPhotos > 0) {
    photos = h(
      "span.field-note",
      `${droppedPhotos} chosen photo${
        droppedPhotos === 1 ? "" : "s"
      } couldn't be kept; choose them again.`
    );
  }

  return h(Card, { className: "draft-row", compact: true }, [
    h("div.draft-info", [
      h("a.draft-title", { href }, title),
      h(
        "span.field-note",
        `${kind} · saved ${new Date(savedAt).toLocaleString()}`
      ),
      photos,
    ]),
    h("div.draft-actions", [
      h(
        Button,
        {
          small: true,
          minimal: true,
          icon: "edit",
          onClick: () => (window.location.href = href),
        },
        "Continue"
      ),
      h(
        Button,
        {
          small: true,
          minimal: true,
          intent: "danger",
          icon: "trash",
          onClick: onDiscard,
        },
        "Discard"
      ),
    ]),
  ]);
}
