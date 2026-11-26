/**
 * A `TableDataProvider` over the Rockd API's `/protected/checkins` route, so the
 * data-sheet library's loading / view-state / selection core drives the feed.
 *
 * ## Addressing
 * `fetchData` is addressed by `{offset, limit}` and so is the route, which
 * takes `?limit=` (up to 200) and `?offset=` — so a window is one request.
 * Sending no `?limit` leaves the route on its original fixed page of five
 * addressed by `?page=N`, which is what every other client still does; this
 * provider opts into the window instead.
 *
 * The route reports no total count, so `totalCount` is omitted and the panel
 * runs as an unknown-length source: the row array grows as windows arrive,
 * with no proportional scrollbar and no "n of m" counter. A count, or keyset
 * paging with a cursor, would close that; this file is deliberately the only
 * place that knows how the feed is addressed.
 */
import { rockdApiURL } from "~/settings";
import type {
  FetchDataFilter,
  FetchDataParams,
  FetchDataResult,
  TableDataProvider,
} from "@macrostrat/data-sheet";
import { translateCheckinFilter } from "./view-config";

/** The route's cap on `?limit=` (`MAX_PAGE_SIZE` in
 * `api/v2/protected/checkins.ts`). A window wider than this takes more than one
 * request; nothing here asks for one that wide. */
const MAX_WINDOW = 200;

/** A small window, for a list in a sidebar rather than a page of its own — the
 * map feeds pass it as their `pageSize`. It happens to be the route's own
 * default page size, but it is a presentation choice now, not a constraint:
 * the window size is the panel's to pick. */
export const API_PAGE_SIZE = 5;

/** The feeds carried over from the app's segment control, plus `orgs`, which
 * the app has no equivalent of. "Unsynced" is absent by design — it describes
 * a device-local queue, which the web has none of. */
export type FeedType = "all" | "nearby" | "mine" | "orgs";

export interface FeedContext {
  feedType: FeedType;
  /** `nearby`: the region of interest's center. The API's radius around it is
   * fixed at 100 km server-side and is not a parameter. */
  center?: { lng: number; lat: number } | null;
  /** `mine`: the signed-in person. */
  personId?: number | null;
  /** `mine`: needed only for a non-public profile — a public one is visible to
   * an unauthenticated request. `orgs`: what decides which organizations the
   * caller is a member of, and so how much of each one they see; without it
   * the feed still works and shows only public organizations' public
   * checkins. Travels in the query string, which is how the app does it and
   * what the route accepts. */
  token?: string | null;
  /** Limits any feed to a region — the map's visible area, on a map page. */
  bounds?: CheckinBounds | null;
}

export interface CheckinBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
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
  /** Set once the checkin has been sent to StraboSpot */
  spot_id?: number | null;
  /** When it was last edited (or its spot_id saved), as the API reports it */
  updated?: string | null;
  /** The organization this checkin was shared with. Both null when it was
   * shared with none; the name travels with the id, so labelling a checkin
   * takes no second request. */
  org_id?: number | null;
  org_name?: string | null;
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
  if (feed.feedType === "orgs") {
    // Every organization at once. The route applies the same rule per org:
    // a member sees everything shared with an org they belong to, and everyone
    // else — signed out included — sees only that org's public checkins.
    // Checkins shared with no organization drop out entirely.
    params.org_id = "all";
    if (feed.token != null) params.token = feed.token;
  }
  if (feed.bounds != null) {
    // Two decimals (~1 km) is past what a map view resolves, and keeps a
    // barely-moved map from changing the request
    params.minlat = feed.bounds.minLat.toFixed(2);
    params.maxlat = feed.bounds.maxLat.toFixed(2);
    params.minlng = feed.bounds.minLng.toFixed(2);
    params.maxlng = feed.bounds.maxLng.toFixed(2);
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

/** Filters the route can't combine with a region: with `minlat`/… present it
 * returns a 500 for these (a server-side bug; `person_id` and the sort are
 * fine). While one is active the search covers every checkin instead — which
 * is also how Explore's search always behaved. */
const REGION_INCOMPATIBLE_PARAMS = ["notes", "int_id", "lith_id"];

function filterParams(filters: FetchDataFilter[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const filter of filters ?? []) {
    Object.assign(params, translateCheckinFilter(filter) ?? {});
  }
  return params;
}

/** One window of rows, straight from the route's own `?limit=`/`?offset=`. */
async function fetchWindow(
  params: Record<string, string>,
  offset: number,
  limit: number,
  signal: AbortSignal
): Promise<Checkin[]> {
  const query = new URLSearchParams({
    ...params,
    limit: String(limit),
    offset: String(offset),
  });
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

      const filtered = filterParams(filters);
      // The route refuses org_id and person_id together — a member sees other
      // members regardless of profile privacy, which contradicts the rule
      // person_id applies — and answers 400. So the Person filter steps aside
      // on this feed rather than breaking the request outright.
      if (feed.feedType === "orgs") delete filtered.person_id;

      let region = feed;
      if (REGION_INCOMPATIBLE_PARAMS.some((p) => filtered[p] != null)) {
        region = { ...feed, bounds: null };
      }
      // The feed's own params go last, so a search can narrow a feed but never
      // widen it: a `mine` feed's `person_id` outranks a Person filter's
      const params = {
        ...orderParams(feed, sorts),
        ...filtered,
        ...feedParams(region),
      };

      // One request per window: the panel's window maps directly onto the
      // route's own `?limit=`/`?offset=`.
      //
      // The loop runs a second time only in two cases. A window wider than the
      // route's 200-row cap needs more than one request. And the dedupe can
      // drop a row — a checkin added mid-scroll shifts every later row down
      // one, so the same checkin can arrive in two consecutive windows — which
      // leaves the window short of what was asked for. That matters because a
      // short window is how the panel detects the end of an unknown-length
      // source, so it has to mean *the end* and not "a duplicate was dropped";
      // topping up keeps the two distinguishable.
      //
      // `fetched` counts rows the server sent, which is what the next offset
      // is measured in; `collected` counts the ones being returned.
      const collected = new RowSet();
      let fetched = 0;
      while (collected.size < limit) {
        const want = Math.min(limit - collected.size, MAX_WINDOW);
        const rows = await fetchWindow(params, offset + fetched, want, signal);
        fetched += rows.length;
        collected.addAll(rows);
        if (rows.length < want) break;
      }

      return { rows: collected.rows.slice(0, limit) };
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
