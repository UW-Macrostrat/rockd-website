/**
 * The shared shell for the `/dev/feed` pages — a list-only reimplementation of
 * the app's `all` / `nearby` / `mine` feeds, built on `DataPanel` from
 * `@macrostrat/data-sheet` so loading, filtering, sorting and page structure
 * come from the library rather than from page-local state.
 *
 * This exists to replace the app's feed state model (an ngrx store with
 * per-feed caches, a `switchingFeedType` flag, and filters that outlive the feed
 * they were set on — see UW-Macrostrat/rockd#332) with one where:
 *
 *  - **the feed is the route.** `all` / `nearby` / `mine` are three URLs, not a
 *    mutable field, so switching feeds cannot leave stale rows or stale filters
 *    behind — the page remounts.
 *  - **the view state is the URL.** The search and sort live in the query string
 *    (`ViewStateURLSync`), as does the nearby center, so any particular search
 *    is a link and the back button works.
 *  - **loading is the library's.** No page-level "current page" / "next page"
 *    prefetch pair; the panel owns the window and the sentinel.
 *
 * `Unsynced` is deliberately absent: it describes a device-local queue.
 */
import {
  AnchorButton,
  ButtonGroup,
  NonIdealState,
  Spinner,
} from "@blueprintjs/core";
import { createMasonryScrollBody } from "@macrostrat/data-sheet";
import { atom, useAtom, useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { Footer } from "~/components";
import { ContentPageHeader } from "~/layouts";
import {
  CheckinFeedPanel,
  FeedLoadProgress,
  type FeedType,
} from "~/components/checkin-feed";
import { locationAtom } from "~/_utils/url-atoms";
import { useStoredRockdAuth } from "~/components/auth";
import { type Center, NearbyMap } from "./nearby-map";
import h from "./feed-page.module.sass";

/**
 * Checkin cards are variable-height — a photo, a long note, or neither — so the
 * library's masonry body (data-sheet 4.6.0) suits them better than the CSS grid
 * it replaces: a grid leaves ragged gaps under short cards, and CSS `columns`
 * re-flows the whole list on every appended page, moving cards under the
 * cursor. The masonry measures each card and freezes its column, so paging only
 * ever adds to the bottom.
 *
 * Responsive: three columns, dropping to fewer when the body is too narrow to
 * give each one a readable width (matching the old grid's `21em` track).
 */
const CardMasonry = createMasonryScrollBody({
  columns: 3,
  minColumnWidth: 320,
});

const FEEDS: { type: FeedType; label: string; href: string }[] = [
  { type: "all", label: "All", href: "/dev/feed" },
  { type: "nearby", label: "Nearby", href: "/dev/feed/nearby" },
  { type: "mine", label: "Mine", href: "/dev/feed/mine" },
];

/** The nearby feed's center point, held in the URL so the region is linkable.
 * It's provider input rather than a filter, which is why it doesn't go through
 * the store's `activeFilters` like the search does. */
const centerAtom = atom(
  (get): Center | null => {
    const params = get(locationAtom).searchParams;
    const lat = params?.get("lat");
    const lng = params?.get("lng");
    if (lat == null || lng == null) return null;
    const center = { lat: Number(lat), lng: Number(lng) };
    if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) {
      return null;
    }
    return center;
  },
  (get, set, center: Center | null) => {
    const loc = get(locationAtom);
    const searchParams = new URLSearchParams(loc.searchParams);
    if (center == null) {
      searchParams.delete("lat");
      searchParams.delete("lng");
    } else {
      searchParams.set("lat", center.lat.toFixed(4));
      searchParams.set("lng", center.lng.toFixed(4));
    }
    set(locationAtom, { ...loc, searchParams });
  }
);

export interface FeedPageProps {
  feedType: FeedType;
}

export function FeedPage({ feedType }: FeedPageProps) {
  if (feedType === "nearby") return h(NearbyFeed);
  if (feedType === "mine") return h(MineFeed);
  return h(Feed, { feedType: "all" });
}

// ---- The three feeds ----

function NearbyFeed() {
  const [center, setCenter] = useAtom(centerAtom);
  return h(Feed, {
    feedType: "nearby",
    // A page-level row, NOT the panel's `sidebar` slot: the map has to render
    // whether or not the feed can load, and until a center is picked there is no
    // feed to put a sidebar on. (That was the bug — the map lived inside the
    // panel, and the panel was replaced by the "pick a center" prompt, so a
    // fresh visit had no map to click.)
    aside: h(NearbyMap, { center, setCenter }),
    center,
    // Without a center the route would fall back to the unfiltered feed, which
    // is not what "nearby" means — so ask for one first.
    placeholder: h.if(center == null)(NonIdealState, {
      icon: "map-marker",
      title: "Pick a center point",
      description: "Choose a spot on the map to see checkins near it.",
    }),
  });
}

function MineFeed() {
  const auth = useStoredAuth();

  if (!auth.checked) return h(Spinner, { className: "feed-spinner" });

  let placeholder = null;
  if (auth.personId == null) {
    placeholder = h(NonIdealState, {
      icon: "user",
      title: "Not signed in",
      description: "Sign in to see the checkins you've recorded.",
      action: h(
        AnchorButton,
        { href: "/login", intent: "primary", icon: "log-in" },
        "Log in"
      ),
    });
  }

  return h(Feed, {
    feedType: "mine",
    personId: auth.personId,
    token: auth.token,
    placeholder,
  });
}

/** The Rockd JWT + person the login flow leaves in `localStorage`. */
function useStoredAuth() {
  const { checked, auth } = useStoredRockdAuth();
  return {
    checked,
    personId: auth?.person?.person_id ?? null,
    token: auth?.token ?? auth?.person?.token ?? null,
  };
}

// ---- The shell ----

interface FeedProps {
  feedType: FeedType;
  center?: Center | null;
  personId?: number | null;
  token?: string | null;
  /** A page-level row above the feed (the nearby map), as wide as the cards.
   * Rendered whether or not the feed itself can load. */
  aside?: ReactNode;
  /** Rendered instead of the list, when the feed can't be fetched yet. */
  placeholder?: ReactNode;
}

function Feed({
  feedType,
  center = null,
  personId = null,
  token = null,
  aside = null,
  placeholder = null,
}: FeedProps) {
  const tabs = h(FeedTabs, { feedType });

  // The tabs sit at the right end of the feed's search row; with no feed yet
  // (a prompt instead), they keep a row of their own, right-aligned the same
  let body = placeholder;
  let tabsRow = h("div.feed-tabs-row", tabs);
  if (body == null) {
    tabsRow = null;
    body = h(CheckinFeedPanel, {
      feed: { feedType, center, personId, token },
      // Cards are small and of uneven height; several fit a row once the page
      // is wide.
      scrollBody: CardMasonry,
      contentFooter: h(FeedFooter),
      // The feed is the page, so a search is a link
      syncURL: true,
      className: "feed-panel",
      toolbarEnd: tabs,
    });
  }

  return h("div.feed-page", [
    h(ContentPageHeader, { className: "feed-header" }),
    h("div.feed-content", [
      // Above the search, as wide as the cards' row
      h.if(aside != null)("div.feed-aside-row", h("aside.feed-aside", aside)),
      tabsRow,
      h("div.feed-body", body),
    ]),
  ]);
}

/** The feed is the route, so the switcher is links — which also means each feed
 * is separately linkable and the back button moves between them. The
 * feed-independent view state (search, sort) is carried across; the nearby
 * center is not, since it means nothing to the other two. */
function FeedTabs({ feedType }: { feedType: FeedType }) {
  const location = useAtomValue(locationAtom);

  const carried = new URLSearchParams();
  for (const key of ["q", "sort"]) {
    const value = location.searchParams?.get(key);
    if (value != null && value !== "") carried.set(key, value);
  }
  const query = carried.toString();

  // The site's outlined grey buttons (the map Settings, the trip header's
  // actions), small to match Sort beside them; the current feed is shaded
  return h(
    ButtonGroup,
    { className: "feed-tabs", outlined: true },
    FEEDS.map(({ type, label, href }) => {
      let target = href;
      if (query !== "") target = `${href}?${query}`;
      return h(
        AnchorButton,
        {
          key: type,
          href: target,
          active: type === feedType,
          outlined: true,
          small: true,
        },
        label
      );
    })
  );
}

/** The end-of-scroll region: load state, then the site footer.
 *
 * It sits in the panel's `contentFooter`, i.e. *inside* the scroll flow, so it
 * is only reached at the bottom of what's loaded — which is what makes it a
 * sensible home for the site footer on an infinite list. With `autoLoadPages`
 * set low, the auto-load checkpoint is reached early enough that the footer is
 * actually reachable rather than theoretical. */
function FeedFooter() {
  return h("div.feed-footer", [
    h(FeedLoadProgress),
    h(Footer, { className: "page-footer" }),
  ]);
}
