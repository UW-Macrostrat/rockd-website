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
  Button,
  ButtonGroup,
  Callout,
  Spinner,
} from "@blueprintjs/core";
import {
  DataPanel,
  DataPanelToolbarStyle,
  LoadProgressIndicator,
  useLoadControls,
} from "@macrostrat/data-sheet";
import "@macrostrat/data-sheet/dist/data-sheet.css";
import hyper from "@macrostrat/hyper";
import { atom, useAtom, useAtomValue } from "jotai";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { RockdSiteIcon } from "~/components";
import {
  initialViewStateFromURL,
  ViewStateURLSync,
} from "~/_utils/data-view-url-state";
import { locationAtom } from "~/_utils/url-atoms";
import { getStoredRockdAuth } from "../../login/rockd-auth";
import { type Center, NearbyMap } from "./nearby-map";
import { createCheckinProvider, type FeedType } from "./checkin-provider";
import { CheckinCard } from "./checkin-card";
import { columnSpec, tableFilters, urlBindings } from "./view-config";
import { AppliedFilters } from "./semantic/applied-filters";
import styles from "./feed-page.module.sass";

const h = hyper.styled(styles);

/** Rows per window. Each costs `PAGE_SIZE / 5` requests, since the API pages by
 * fives — so this trades requests for scrolling feel. */
const PAGE_SIZE = 20;
/** Windows auto-loaded before the footer's "Load more" takes over. Deliberately
 * small: scrolling forever is how you lose your place, and narrowing the search
 * is the better way to reach something deep. The checkpoint is the point. */
const AUTO_LOAD_PAGES = 3;

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
    // The map rides in the panel's own sidebar, so it stays put beside the list
    // (and scrolls independently) rather than being pushed off the top.
    sidebar: h(NearbyMap, { center, setCenter }),
    center,
    // Without a center the route would fall back to the unfiltered feed, which
    // is not what "nearby" means — so ask for one first.
    placeholder: h.if(center == null)(
      Callout,
      { intent: "primary", icon: "map-marker" },
      "Choose a center point to see checkins near it."
    ),
  });
}

function MineFeed() {
  const auth = useStoredAuth();

  if (!auth.checked) return h(Spinner, { className: "feed-spinner" });

  let placeholder = null;
  if (auth.personId == null) {
    placeholder = h(Callout, { intent: "primary", icon: "user" }, [
      "Sign in to see your checkins. ",
      h("a", { href: "/login" }, "Log in"),
    ]);
  }

  return h(Feed, {
    feedType: "mine",
    personId: auth.personId,
    token: auth.token,
    placeholder,
  });
}

/** The Rockd JWT + person the login flow leaves in `localStorage`. Read in an
 * effect because it isn't available during a server render. */
function useStoredAuth() {
  const [auth, setAuth] = useState<{
    checked: boolean;
    personId: number | null;
    token: string | null;
  }>({ checked: false, personId: null, token: null });

  useEffect(() => {
    const stored = getStoredRockdAuth();
    setAuth({
      checked: true,
      personId: stored?.person?.person_id ?? null,
      token: stored?.token ?? stored?.person?.token ?? null,
    });
  }, []);

  return auth;
}

// ---- The shell ----

interface FeedProps {
  feedType: FeedType;
  center?: Center | null;
  personId?: number | null;
  token?: string | null;
  /** Rendered beside the list, in the panel's sidebar (the nearby map). */
  sidebar?: ReactNode;
  /** Rendered instead of the list, when the feed can't be fetched yet. */
  placeholder?: ReactNode;
}

function Feed({
  feedType,
  center = null,
  personId = null,
  token = null,
  sidebar = null,
  placeholder = null,
}: FeedProps) {
  const provider = useMemo(
    () => createCheckinProvider({ feedType, center, personId, token }),
    [feedType, center?.lng, center?.lat, personId, token]
  );

  // The panel resets on a view-state change or a `refreshToken` change, not on
  // a provider swap — so the provider's own inputs have to be announced here.
  const refreshToken = `${feedType}:${center?.lng ?? ""},${
    center?.lat ?? ""
  }:${personId ?? ""}`;

  // A linked view (`?q=…&sort=…`) is applied when the store is created, so the
  // first request is the right one rather than an unfiltered one immediately
  // superseded. `ViewStateURLSync` keeps the two in step from there.
  const { initialFilters, initialSorts } =
    initialViewStateFromURL(urlBindings);

  let body = placeholder;
  if (body == null) {
    body = h(
      "div.data-panel-container",
      h(DataPanel, {
        provider,
        refreshToken,
        itemComponent: CheckinCard,
        sidebar,
        // Cards are small; several fit a row once the page is wide.
        scrollBody: CardGrid,
        // Sits beside the Filter/Sort controls (it's passed as the actions
        // toolbar's children), showing the active filter *values*.
        toolbar: h(AppliedFilters),
        columnSpec,
        filters: tableFilters,
        initialFilters,
        initialSorts,
        pageSize: PAGE_SIZE,
        autoLoadPages: AUTO_LOAD_PAGES,
        className: "feed-panel",
        // The counter is folded into the inline footer.
        statusBar: false,
        toolbarStyle: DataPanelToolbarStyle.FLOATING,
        contentFooter: h(FeedFooter),
        // Typing shouldn't fire a request per keystroke; the input stays
        // instant, only the fetch waits for the view to settle.
        filterDebounce: 300,
        itemLabel: "checkin",
        name: "Checkins",
        children: h(ViewStateURLSync, { bindings: urlBindings }),
      })
    );
  }

  return h("div.feed-page", [
    h("header.feed-header", [
      h(RockdSiteIcon, { className: "site-icon" }),
      h("h1.page-title", "Checkins"),
    ]),
    h("div.feed-content", [h(FeedTabs, { feedType }), body]),
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

  return h(
    ButtonGroup,
    { className: "feed-tabs" },
    FEEDS.map(({ type, label, href }) => {
      let target = href;
      if (query !== "") target = `${href}?${query}`;
      return h(
        AnchorButton,
        { key: type, href: target, active: type === feedType },
        label
      );
    })
  );
}

/** The card layout. The panel still owns the scroll container and the loading
 * sentinel, so paging and selection keep working over any arrangement. */
function CardGrid({ children }: { children?: ReactNode }) {
  return h("div.card-grid", children);
}

function FeedFooter() {
  const controls = useLoadControls();

  let more = null;
  if (controls.paused) {
    more = h(
      Button,
      { minimal: true, intent: "primary", onClick: controls.loadMore },
      "Load more"
    );
  }

  return h("div.feed-footer", [h(LoadProgressIndicator), more]);
}
