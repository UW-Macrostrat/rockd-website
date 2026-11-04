/**
 * A checkin's or observation's photo: the current one (on the server, or a
 * file just chosen) with a file chooser to replace it. The route has no way
 * to *remove* a stored photo — only to replace it — so a photo already on
 * Rockd can't be cleared here, and the field says so.
 *
 * Choosing a file reads its EXIF; the parent decides whether to offer the
 * photo's position and date for the checkin (`onExif`).
 */
import { Button, FileInput } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { getImageUrl } from "~/components";
import { ReservedImage } from "~/components/checkin-feed/checkin-card-parts";
import {
  createLocalPhoto,
  type LocalPhoto,
  type PhotoExif,
  type PhotoRef,
} from "~/checkin-editor";
import styles from "./checkin-editor.module.sass";

const h = hyper.styled(styles);

export interface PhotoFieldProps {
  photo: PhotoRef | null;
  onChange: (photo: PhotoRef | null) => void;
  /** The photo as loaded, to go back to when a chosen file is discarded */
  original?: PhotoRef | null;
  /** Whose image URLs to build, for a stored photo */
  personId: number | null;
  onExif?: (exif: PhotoExif | null, photo: LocalPhoto) => void;
  label?: string;
}

export function PhotoField({
  photo,
  onChange,
  original = null,
  personId,
  onExif,
  label = "Photo",
}: PhotoFieldProps) {
  const [error, setError] = useState<string | null>(null);

  async function choose(event: React.FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (file == null) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file");
      return;
    }
    const local = await createLocalPhoto(file);
    onChange(local);
    onExif?.(local.exif ?? null, local);
    // So choosing the same file again fires a change
    input.value = "";
  }

  let text = "Choose a photo…";
  if (photo != null) text = "Replace photo…";

  let discard = null;
  if (photo?.kind === "local") {
    discard = h(
      Button,
      {
        minimal: true,
        small: true,
        icon: "undo",
        onClick: () => onChange(original),
      },
      "Discard"
    );
  }

  let note = null;
  if (photo?.kind === "remote") {
    note = h("span.field-note", "A stored photo can be replaced, not removed.");
  }

  return h("div.photo-field", [
    h("div.field-label", label),
    h(PhotoPreview, { photo, personId }),
    h("div.photo-actions", [
      h(FileInput, {
        text,
        buttonText: "Browse",
        inputProps: { accept: "image/*" },
        onInputChange: choose,
        small: true,
      }),
      discard,
    ]),
    note,
    h.if(error != null)("span.field-error", error),
  ]);
}

function PhotoPreview({
  photo,
  personId,
}: {
  photo: PhotoRef | null;
  personId: number | null;
}) {
  if (photo == null) {
    return h("div.photo-preview.empty", "No photo");
  }
  if (photo.kind === "local") {
    return h("img.photo-preview", {
      src: photo.previewURL,
      alt: photo.file.name,
    });
  }
  return h(ReservedImage, {
    className: styles["photo-preview"],
    src: getImageUrl(personId, photo.id),
    alt: "Photo",
  });
}
