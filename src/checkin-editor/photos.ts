/**
 * Photos chosen in the browser: how a `File` becomes a draft's `LocalPhoto`,
 * and how it's encoded for `POST /protected/photos`, which takes a base64
 * data URL (the app reads its saved JPEG the same way).
 *
 * The server (`lib/photos.ts`) runs the upload through sharp — auto-rotating
 * by EXIF and making the resized variants — so a JPEG goes up as-is, EXIF
 * and all, unless it's big enough that a 50 MB request body or a slow
 * connection would be the limit. Then, and for any non-JPEG the browser can
 * decode, it's re-encoded through a canvas.
 */
import { readExif } from "./exif";
import type { LocalPhoto } from "./types";
import { newClientId } from "./types";

/** JPEGs at or under this go up untouched */
const MAX_DIRECT_BYTES = 8 * 1024 * 1024;
/** The long edge of a re-encoded photo. Rockd's largest variant is smaller. */
const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.88;

export async function createLocalPhoto(file: File): Promise<LocalPhoto> {
  const exif = await readExif(file);
  return {
    kind: "local",
    localId: `${newClientId()}.jpg`,
    file,
    previewURL: URL.createObjectURL(file),
    exif,
  };
}

/** Frees a local photo's preview URL once the draft no longer holds it */
export function releaseLocalPhoto(photo: LocalPhoto | null | undefined) {
  if (photo?.previewURL != null) URL.revokeObjectURL(photo.previewURL);
}

/** The photo as the upload route wants it: a `data:image/jpeg;base64,…` URL */
export async function encodePhotoForUpload(photo: LocalPhoto): Promise<string> {
  const { file } = photo;
  const isJPEG = file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name);
  if (isJPEG && file.size <= MAX_DIRECT_BYTES) {
    return await readAsDataURL(file);
  }
  return await reencodeAsJPEG(file);
}

function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Couldn't read the photo"));
    reader.readAsDataURL(blob);
  });
}

/** Decodes the image (honoring its EXIF orientation, so the re-encoded JPEG
 * is upright without the tag) and draws it onto a bounded canvas */
async function reencodeAsJPEG(file: File): Promise<string> {
  const bitmap = await decodeImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx == null) throw new Error("Couldn't prepare the photo for upload");
  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap) (bitmap as ImageBitmap).close();
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

async function decodeImage(
  file: File
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to an <img>, which some browsers decode more formats with
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error(`This browser can't read ${file.name}`));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
