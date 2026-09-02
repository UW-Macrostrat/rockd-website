/**
 * A `TableDataProvider` over the Rockd API's `/protected/checkins` route, so the
 * data-sheet library's loading / view-state / selection core drives the feed.
 *
 * ## The impedance mismatch, and how it's bridged
 * `fetchData` is addressed by `{offset, limit}`, but the route pages by
 * `?page=N` with a **server-side hard-coded `LIMIT 5`** (see
 * `api/v2/protected/checkins.ts` in the `rockd` repo) — `page` is the only
 * addressing available, and `?all=1` removes the limit entirely rather than
 * raising it. So one window is assembled from `ceil(limit / 5)` page requests
 * issued in parallel and sliced to the requested range. That keeps `pageSize`
 * a free choice on the panel (the scrolling feel is the panel's, not the API's)
 * at the cost of several small requests per chunk.
 *
 * The route also reports no total count, so `totalCount` is omitted and the
 * panel runs as an unknown-length source: the row array grows as chunks arrive,
 * with no proportional scrollbar and no "n of m" counter.
 *
 * Both go away with keyset pagination (`limit` + a cursor + a count) on the
 * Rockd side; this file is deliberately the only place that knows about it.
 */
import { rockdApiURL } from "~/settings";
import type {
  FetchDataFilter,
  FetchDataParams,
  FetchDataResult,
  TableDataProvider,
} from "@macrostrat/data-sheet";
import { translateCheckinFilter } from "./view-config";

/** Rows per request. Fixed by the API, not a preference. */
export const API_PAGE_SIZE = 5;

/** The feeds carried over from the app's segment control. "Unsynced" is absent
 * by design — it describes a device-local queue, which the web has none of. */
export type FeedType = "all" | "nearby" | "mine";

export interface FeedContext {
  feedType: FeedType;
  /** `nearby`: the region of interest's center. The API's radius around it is
   * fixed at 100 km server-side and is not a parameter. */
  center?: { lng: number; lat: number } | null;
  /** `mine`: the signed-in person. */
  personId?: number | null;
  /** `mine`: needed only for a non-public profile — a public one is visible to
   * an unauthenticated request. Travels in the query string, which is how the
   * app does it and what the route accepts. */
  token?: string | null;
}

/** One checkin as the route returns it (the fields this feed reads). */
export interface Checkin {
  checkin_id: number;
  person_id: number;
  first_name: string;
  last_name: string;
  notes: string;
  rating: number;
  lng: number;
  lat: number;
  near: string;
  created: string;
  added: string;
  photo: number | null;
  likes: number | string;
  comments: number;
  liked: boolean;
  observations?: unknown[];
}

/** Column key → the route's `orderBy` value. `likes` is deliberately absent:
 * the route's `orderBy=likes` branch appends to an empty `order` string and
 * emits `ORDER BY , …`, so it is a server-side error rather than a sort. */
const ORDER_BY: Record<string, string> = {
  created: "observed",
  added: "added",
  rating: "rating",
};

/** Query params for the feed itself — the part of the request the user's
 * filters don't own. */
function feedParams(feed: FeedContext): Record<string, string> {
  const params: Record<string, string> = {};
  if (feed.feedType === "nearby" && feed.center != null) {
    params.lng = String(feed.center.lng);
    params.lat = String(feed.center.lat);
  }
  if (feed.feedType === "mine" && feed.personId != null) {
    params.person_id = String(feed.personId);
    if (feed.token != null) params.token = feed.token;
  }
  return params;
}

/** Active sorts → `orderBy` + `sort`. The route honors one ordering, so only
 * the highest-priority sort is sent. `nearby` falls back to distance ordering
 * when the user hasn't chosen one, which is what makes it a *nearby* feed. */
function orderParams(
  feed: FeedContext,
  sorts: FetchDataParams["sorts"]
): Record<string, string> {
  const sort = (sorts ?? []).find((s) => ORDER_BY[s.key] != null);
  if (sort != null) {
    return {
      orderBy: ORDER_BY[sort.key],
      sort: sort.ascending ? "asc" : "desc",
    };
  }
  if (feed.feedType === "nearby" && feed.center != null) {
    return { orderBy: "distance" };
  }
  return {};
}

function filterParams(filters: FetchDataFilter[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const filter of filters ?? []) {
    Object.assign(params, translateCheckinFilter(filter) ?? {});
  }
  return params;
}

async function fetchPage(
  params: Record<string, string>,
  page: number,
  signal: AbortSignal
): Promise<Checkin[]> {
  const query = new URLSearchParams({ ...params, page: String(page) });
  const res = await fetch(`${rockdApiURL}/protected/checkins?${query}`, {
    signal,
  });
  if (!res.ok) {
    throw new Error(`Checkin request failed (${res.status})`);
  }
  const body = await res.json();
  return body?.success?.data ?? [];
}

/**
 * A provider for one feed. Identity is by `checkin_id`, so the row identity
 * survives the re-ordering a sort change causes.
 *
 * `nearby`'s center is baked in here rather than expressed as a filter, so it
 * changes the provider rather than the view state. The panel doesn't reset on a
 * provider swap — pass a `refreshToken` that changes with the center.
 */
export function createCheckinProvider(
  feed: FeedContext
): TableDataProvider<Checkin> {
  return {
    identity: (row) => row.checkin_id,
    async fetchData({
      offset,
      limit,
      sorts,
      filters,
      signal,
    }: FetchDataParams): Promise<FetchDataResult<Checkin>> {
      // `mine` with nobody signed in would otherwise fetch the whole public
      // feed — the route treats an absent `person_id` as "no filter".
      if (feed.feedType === "mine" && feed.personId == null) {
        return { rows: [], totalCount: 0 };
      }

      const params = {
        ...feedParams(feed),
        ...orderParams(feed, sorts),
        ...filterParams(filters),
      };

      // The window may start mid-page, since the API's pages are five rows and
      // the panel's chunks are not.
      const firstPage = Math.floor(offset / API_PAGE_SIZE) + 1;
      const skip = offset % API_PAGE_SIZE;
      const pageCount = Math.ceil((skip + limit) / API_PAGE_SIZE);

      // The common case in one round trip.
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, i) =>
          fetchPage(params, firstPage + i, signal)
        )
      );
      const collected = new RowSet();
      let exhausted = false;
      for (const page of pages) {
        collected.addAll(page);
        if (page.length < API_PAGE_SIZE) exhausted = true;
      }

      // A short window is how the panel detects the end of an unknown-length
      // source, so it must mean *the end* and not "a duplicate was dropped".
      // A checkin inserted between two of the parallel requests above shifts
      // every later page down a row, which duplicates one across a page
      // boundary — so top up from the next page until the window is full or a
      // page really does come back short. Serial, and normally never entered.
      let nextPage = firstPage + pageCount;
      while (!exhausted && collected.size < skip + limit) {
        const page = await fetchPage(params, nextPage, signal);
        nextPage += 1;
        collected.addAll(page);
        if (page.length < API_PAGE_SIZE) exhausted = true;
      }

      return { rows: collected.rows.slice(skip, skip + limit) };
    },
  };
}

/** Accumulates rows in order, dropping repeats. Page boundaries shift when a
 * checkin is added mid-scroll, so the same row can arrive twice; rendering it
 * twice would also collide React keys. */
class RowSet {
  readonly rows: Checkin[] = [];
  private readonly seen = new Set<number>();

  get size(): number {
    return this.rows.length;
  }

  addAll(rows: Checkin[]) {
    for (const row of rows) {
      if (row?.checkin_id == null || this.seen.has(row.checkin_id)) continue;
      this.seen.add(row.checkin_id);
      this.rows.push(row);
    }
  }
}
