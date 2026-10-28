/**
 * A searchable, infinitely scrolling list of checkins: `DataPanel` from
 * `@macrostrat/data-sheet` over the Rockd checkin route, with the search and
 * facet filter at the top. The `/dev/feed` pages and the map pages' sidebars
 * are both this panel, configured with their own feed, card and layout.
 */
import { Button } from "@blueprintjs/core";
import {
  DataPanel,
  DataPanelToolbarStyle,
  LoadProgressIndicator,
  SelectionInteractionStyle,
  useLoadControls,
  type ItemComponentProps,
} from "@macrostrat/data-sheet";
import "@macrostrat/data-sheet/dist/data-sheet.css";
// The search's age and lithology chips (`IntervalTag`, `LithologyTag`) and the
// cards' coordinates. Loaded here rather than relied on from the checkin page,
// whose stylesheet otherwise only arrived after visiting one.
import "@macrostrat/data-components/dist/data-components.css";
import classNames from "classnames";
import { type ComponentType, type ReactNode, useMemo } from "react";
import {
  initialViewStateFromURL,
  ViewStateURLSync,
} from "~/_utils/data-view-url-state";
import { CheckinCard } from "./checkin-card";
import {
  type Checkin,
  createCheckinProvider,
  type FeedContext,
} from "./checkin-provider";
import {
  createOmniFilterAction,
  omniFilterAction,
} from "./semantic/omni-filter";
import { personFacet, SEMANTIC_FACETS } from "./semantic/facets";
import { columnSpec, tableFilters, urlBindings } from "./view-config";
import h from "./feed-panel.module.sass";

/** Rows per window. Each costs `PAGE_SIZE / 5` requests, since the API pages by
 * fives — so this trades requests for scrolling feel. */
const PAGE_SIZE = 20;
/** Windows auto-loaded before the footer's "Load more" takes over. Deliberately
 * small: scrolling forever is how you lose your place, and narrowing the search
 * is the better way to reach something deep. The checkpoint is the point. */
const AUTO_LOAD_PAGES = 3;

/** A `mine` feed is one person's checkins (and the provider keeps it so), so
 * its search has no Person facet to offer. */
const mineSearchAction = createOmniFilterAction({
  facets: SEMANTIC_FACETS.filter((f) => f !== personFacet),
});

export interface CheckinFeedPanelProps {
  feed: FeedContext;
  /** How each checkin renders; the feed's link card by default */
  itemComponent?: ComponentType<ItemComponentProps<Checkin>>;
  /** The panel's scroll body, e.g. a masonry of several columns */
  scrollBody?: any;
  /** The end of the scrolled list; the load state by default */
  contentFooter?: ReactNode;
  /** Keeps the search and sort in the page's query string, so a search is a
   * link. For pages whose URL is the list's own. */
  syncURL?: boolean;
  /** For the `DataPanel`, e.g. to set its `--data-panel-content-width` */
  className?: string;
}

export function CheckinFeedPanel({
  feed,
  itemComponent = CheckinCard,
  scrollBody,
  contentFooter = h(FeedLoadProgress),
  syncURL = false,
  className,
}: CheckinFeedPanelProps) {
  const { feedType, center, personId, token, bounds } = feed;
  const provider = useMemo(
    () => createCheckinProvider({ feedType, center, personId, token, bounds }),
    [feedType, center?.lng, center?.lat, personId, token, boundsKey(bounds)]
  );

  // The panel resets on a view-state change or a `refreshToken` change, not on
  // a provider swap — so the provider's own inputs have to be announced here.
  const refreshToken = `${feedType}:${center?.lng ?? ""},${center?.lat ?? ""}:${
    personId ?? ""
  }:${boundsKey(bounds)}`;

  // A linked view (`?q=…&sort=…`) is applied when the store is created, so the
  // first request is the right one rather than an unfiltered one immediately
  // superseded. `ViewStateURLSync` keeps the two in step from there.
  let initialView = {};
  if (syncURL) {
    initialView = initialViewStateFromURL(urlBindings);
  }

  let searchAction = omniFilterAction;
  if (feedType === "mine") {
    searchAction = mineSearchAction;
  }

  return h(
    "div.checkin-feed-panel",
    h(DataPanel, {
      provider,
      refreshToken,
      itemComponent,
      scrollBody,
      // The entire filter surface: search, facets and the applied tags in one
      // control. Passed as an action so it sits left of Sort; `filters: []`
      // keeps the built-in Filter menu out of the way.
      actions: [searchAction],
      // The cards renderer enables selection by default, which added a
      // selectable affordance with no action behind it.
      enableSelection: SelectionInteractionStyle.NEVER,
      columnSpec,
      filters: tableFilters,
      ...initialView,
      pageSize: PAGE_SIZE,
      autoLoadPages: AUTO_LOAD_PAGES,
      // On the panel itself, since it sets its own `--data-panel-*` defaults
      className: classNames("feed-data-panel", className),
      // The counter is folded into the inline footer.
      statusBar: false,
      toolbarStyle: DataPanelToolbarStyle.FLOATING,
      contentFooter,
      // Typing shouldn't fire a request per keystroke; the input stays
      // instant, only the fetch waits for the view to settle.
      filterDebounce: 300,
      itemLabel: "checkin",
      name: "Checkins",
      children: h.if(syncURL)(ViewStateURLSync, { bindings: urlBindings }),
    })
  );
}

/** The end-of-list load state: progress, then "Load more" once the
 * auto-loaded windows run out. */
export function FeedLoadProgress({ className }: { className?: string }) {
  const controls = useLoadControls();

  let more = null;
  if (controls.paused) {
    more = h(
      Button,
      { minimal: true, intent: "primary", onClick: controls.loadMore },
      "Load more"
    );
  }

  return h("div.load-progress", { className: classNames(className) }, [
    h(LoadProgressIndicator),
    more,
  ]);
}

function boundsKey(bounds: FeedContext["bounds"]): string {
  if (bounds == null) return "";
  return [bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng]
    .map((d) => d.toFixed(2))
    .join(",");
}
