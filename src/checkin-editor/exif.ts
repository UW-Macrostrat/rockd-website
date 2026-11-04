/**
 * The EXIF fields the editor cares about, read in the browser from a JPEG's
 * APP1 segment: when the photo was taken and where. The app gets these from
 * the camera plugin; the web has no plugin, and the whole EXIF spec is far
 * more than two fields need, so this is a minimal TIFF/IFD walk rather than a
 * dependency.
 *
 * Only JPEG carries EXIF this way (HEIC and PNG are out of scope), and a
 * photo exported from a messaging app usually has none — so every result is
 * optional and a failure to read is just "nothing known".
 */
import type { PhotoExif, LngLat } from "./types";

const EXIF_HEADER = "Exif\0\0";
const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_IFD = 0x8825;
const TAG_DATETIME_ORIGINAL = 0x9003;
const TAG_DATETIME = 0x0132;
const TAG_GPS_LAT_REF = 0x0001;
const TAG_GPS_LAT = 0x0002;
const TAG_GPS_LNG_REF = 0x0003;
const TAG_GPS_LNG = 0x0004;

/** Only the head of the file holds EXIF; 256 KB covers any real APP1. */
const HEAD_BYTES = 256 * 1024;

export async function readExif(file: File | Blob): Promise<PhotoExif | null> {
  try {
    const head = await file.slice(0, HEAD_BYTES).arrayBuffer();
    const app1 = findApp1(new DataView(head));
    if (app1 == null) return null;
    return parseTiff(app1);
  } catch {
    return null;
  }
}

/** The TIFF block inside the first EXIF APP1 segment of a JPEG, or null. */
function findApp1(view: DataView): DataView | null {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null;
    const marker = view.getUint8(offset + 1);
    // Start of scan: no more metadata segments
    if (marker === 0xda) return null;
    const length = view.getUint16(offset + 2);
    if (marker === 0xe1) {
      const start = offset + 4;
      const header = ascii(view, start, EXIF_HEADER.length);
      if (header === EXIF_HEADER) {
        const tiffStart = start + EXIF_HEADER.length;
        const end = Math.min(offset + 2 + length, view.byteLength);
        return new DataView(
          view.buffer,
          view.byteOffset + tiffStart,
          end - tiffStart
        );
      }
    }
    offset += 2 + length;
  }
  return null;
}

function parseTiff(tiff: DataView): PhotoExif | null {
  const order = tiff.getUint16(0);
  let little: boolean;
  if (order === 0x4949) little = true;
  else if (order === 0x4d4d) little = false;
  else return null;
  if (tiff.getUint16(2, little) !== 0x002a) return null;

  const reader = new TiffReader(tiff, little);
  const ifd0 = reader.readIFD(tiff.getUint32(4, little));

  let taken: Date | null = null;
  let position: LngLat | null = null;

  const exifOffset = ifd0.get(TAG_EXIF_IFD)?.offsetValue;
  if (exifOffset != null) {
    const exif = reader.readIFD(exifOffset);
    taken = parseExifDate(exif.get(TAG_DATETIME_ORIGINAL)?.ascii);
  }
  if (taken == null) taken = parseExifDate(ifd0.get(TAG_DATETIME)?.ascii);

  const gpsOffset = ifd0.get(TAG_GPS_IFD)?.offsetValue;
  if (gpsOffset != null) {
    const gps = reader.readIFD(gpsOffset);
    position = parseGPS(gps);
  }

  if (taken == null && position == null) return null;
  return { taken, position };
}

interface IFDEntry {
  type: number;
  count: number;
  /** The entry's value field read as an offset (for sub-IFD pointers) */
  offsetValue: number;
  ascii: string | null;
  rationals: number[] | null;
}

class TiffReader {
  constructor(private view: DataView, private little: boolean) {}

  readIFD(offset: number): Map<number, IFDEntry> {
    const entries = new Map<number, IFDEntry>();
    if (offset + 2 > this.view.byteLength) return entries;
    const count = this.view.getUint16(offset, this.little);
    for (let i = 0; i < count; i++) {
      const base = offset + 2 + i * 12;
      if (base + 12 > this.view.byteLength) break;
      const tag = this.view.getUint16(base, this.little);
      const type = this.view.getUint16(base + 2, this.little);
      const n = this.view.getUint32(base + 4, this.little);
      const size = TYPE_SIZES[type] ?? 1;
      let valueOffset = base + 8;
      if (size * n > 4)
        valueOffset = this.view.getUint32(base + 8, this.little);
      entries.set(tag, {
        type,
        count: n,
        offsetValue: this.view.getUint32(base + 8, this.little),
        ascii: this.readAscii(type, valueOffset, n),
        rationals: this.readRationals(type, valueOffset, n),
      });
    }
    return entries;
  }

  private readAscii(type: number, offset: number, n: number): string | null {
    if (type !== 2) return null;
    if (offset + n > this.view.byteLength) return null;
    return ascii(this.view, offset, n).replace(/\0+$/, "");
  }

  private readRationals(
    type: number,
    offset: number,
    n: number
  ): number[] | null {
    if (type !== 5 && type !== 10) return null;
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const at = offset + i * 8;
      if (at + 8 > this.view.byteLength) return null;
      let num: number;
      let den: number;
      if (type === 5) {
        num = this.view.getUint32(at, this.little);
        den = this.view.getUint32(at + 4, this.little);
      } else {
        num = this.view.getInt32(at, this.little);
        den = this.view.getInt32(at + 4, this.little);
      }
      if (den === 0) out.push(0);
      else out.push(num / den);
    }
    return out;
  }
}

/** Byte sizes of the TIFF field types */
const TYPE_SIZES: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
};

function ascii(view: DataView, start: number, length: number): string {
  let out = "";
  const end = Math.min(start + length, view.byteLength);
  for (let i = start; i < end; i++)
    out += String.fromCharCode(view.getUint8(i));
  return out;
}

/** "YYYY:MM:DD HH:MM:SS", in the camera's local time, as a local Date */
function parseExifDate(value: string | null | undefined): Date | null {
  if (value == null) return null;
  const match = value.match(
    /^(\d{4}):(\d{2}):(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/
  );
  if (match == null) return null;
  const [, y, mo, d, h = "0", mi = "0", s = "0"] = match;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s)
  );
  if (Number.isNaN(date.getTime())) return null;
  // Cameras with no clock write all zeros
  if (Number(y) < 1900) return null;
  return date;
}

function parseGPS(gps: Map<number, IFDEntry>): LngLat | null {
  const lat = dms(gps.get(TAG_GPS_LAT)?.rationals);
  const lng = dms(gps.get(TAG_GPS_LNG)?.rationals);
  if (lat == null || lng == null) return null;
  const latRef = (gps.get(TAG_GPS_LAT_REF)?.ascii ?? "N").toUpperCase();
  const lngRef = (gps.get(TAG_GPS_LNG_REF)?.ascii ?? "E").toUpperCase();
  let signedLat = lat;
  let signedLng = lng;
  if (latRef.startsWith("S")) signedLat = -lat;
  if (lngRef.startsWith("W")) signedLng = -lng;
  // A photo with no fix often carries 0, 0 rather than no tag
  if (signedLat === 0 && signedLng === 0) return null;
  if (Math.abs(signedLat) > 90 || Math.abs(signedLng) > 180) return null;
  return { lat: signedLat, lng: signedLng };
}

function dms(values: number[] | null | undefined): number | null {
  if (values == null || values.length < 1) return null;
  const [deg, min = 0, sec = 0] = values;
  if (!Number.isFinite(deg)) return null;
  return deg + min / 60 + sec / 3600;
}
