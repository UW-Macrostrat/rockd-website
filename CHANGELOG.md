# Changelog

## Unreleased

- The map pages (Explore, My checkins, StraboSpot, a trip and the new Trips
  page) are built from one set of components in `~/components/map-sidebar`:
  - `MapSidebarLayout`, built on `@macrostrat/map-interface`'s
    `MapAreaContainer` slots and `FloatingNavbar` as Macrostrat's map pages
    are: a floating panel with the Rockd icon, the view's title, the page's own
    controls (StraboSpot's link button), Settings, the account button (icon
    only) and a close button, over a scrolling body.
  - `RockdMapPage`: that layout around the map, with the standard Settings
    view (`MapSettingsPanel`: Dark/Light, Satellite and Overlay, as a centered
    column of the same outlined grey button; a toggle is shaded only while
    it's on) and the map style
    (`useRockdMapStyle`: the Mapbox base map, the Macrostrat overlay and the
    page's own layers). Settings are shared across the map pages.
  - Point layers: the Rockd API's clustered checkin tiles, or points clustered
    in the browser (`clusteredPointsStyle`). `MapPointClicks` handles clicks as
    Explore always has: a cluster zooms in, a point gets a blue pin
    (`SelectedPin`) and shows in the sidebar, and a click elsewhere clears it.
  - `CheckinMapPage`: Explore, My checkins and StraboSpot, each just its title,
    list and filter. A checkin picked on the map shows as the map pages'
    checkin card under "Selected checkins".
- A sign-in indicator, `UserPersona` (`~/components/auth`), as Macrostrat's:
  signed in, a button with the user's name, opening a panel with their name
  and email, "My checkins" and Log out; signed out, "Sign in", opening a
  panel that links to `/login`. Either way the panel links to Explore and
  Trips (with the footer's icons), the checkin feed and Organizations. It's at the top right of the `/dev/feed` and
  `/orgs` pages, and, icon only (`compact`), in every map page's
  sidebar header right of Settings, where its Log out is the page's own. The
  stored login's helpers (`rockd-auth`) moved there from `pages/login`.
- Trips (`~/components/trips`):
  - A trip's page has a "Trips" sidebar with a header card (the trip's name,
    edited date and stop count, description, KMZ download and a Comments view)
    over its stops in trip order, each the map pages' checkin card under its
    stop's name. On the map, each stop is its own blue point, joined in order
    by a dotted line; picking one scrolls the sidebar to its card (outlined).
    Closing the trip returns to `/trips`, at the view it was left in.
  - `/trips` puts every public trip on the map as one clustered point (its
    first stop), from the Rockd API's `/trips?points=true`, and lists the 10
    most recent as cards: the author's gravatar, name and the trip's date (the
    checkin cards' byline), then its name, description, and stop, like and
    comment counts. Picking a trip in either opens its page. The footer links
    to it under Explore.

- Explore's, My checkins' and StraboSpot's sidebar lists are the `/dev/feed`
  checkin list (StraboSpot's keeps its selection mode, "Send to Strabospot",
  sent badges and results dialog around it):
  `CheckinFeedPanel` (`~/components/checkin-feed`, moved from
  `pages/dev/feed` with its provider, cards and search) in one column, scrolling
  infinitely (one API page of 5 at a time, so a reload is a single request and
  more load only as the sidebar is scrolled), with the notes/age/lithology/person
  search at the top. Explore's
  list follows the map's visible area; a card flies the map to its checkin,
  with "Details" opening the checkin page. The search replaces Explore's filter
  button and panel. A notes, age or lithology search covers every checkin, since
  the Rockd API errors when those are combined with a region. Explore's Overlay
  setting toggles the map overlay again (it was wired to the old filter).
  A `mine` feed (My checkins) only ever searches the signed-in user's own
  checkins: its `person_id` outranks any filter, and its search has no Person
  facet. The search's age and lithology chips are styled on every page that
  shows the list; they had relied on the checkin page's stylesheet.

- Standard page chrome shared with the Macrostrat website. A page's
  `pageStyle` config picks a layout from `~/layouts` (`home`, `content`,
  `fullscreen`). `content` pages get `SitePageHeader` — `PageHeader` from
  `@macrostrat/ui-components` with the Rockd logo and a breadcrumb trail
  ending in the page's `title` (`Rockd › Section › Page`) on one row; a page's
  `headerActions` config adds header controls — and the new Macrostrat-style
  `Footer` (link lists, credits and a hydration-safe `ThemeButton`). Terms,
  Privacy, Metrics, Organizations and the checkin page (titled by its notes)
  use the `content` layout and the homepage
  the `home` layout, replacing their hand-built headers and footers; the
  Metrics "Show bar charts" switch sits in its header. Upgraded
  `@macrostrat/ui-components` to 5.5.0 and imported its stylesheet.

- The homepage's "Explore the data" and "Login" buttons are minimal buttons in
  the Rockd wordmark's blue and green (a solid border and an
  80%-opacity fill that turns solid on hover),
  so they read as clickable; `/login`'s Login button is the same green.

- Added development-only organization directory and creation pages (`/orgs`
  and `/orgs/new`), with a typed
  Rockd organization API client, URL-backed directory search and filters,
  accessible organization cards, and validated organization setup fields. The
  brand-color field includes a synchronized picker, and external organization
  URLs are protocol-checked again when rendered with safer link and image
  privacy attributes. The directory has an "Organizations" heading, with
  "New organization" beside its introduction.

- Added a "Continue with Apple" option to `/login`, alongside Google and
  Facebook. Requires the matching API support in UW-Macrostrat/rockd; the
  button routes to `/auth/apple` and returns through the existing
  `/login/callback` handler, so no changes to session storage or the
  post-login redirect.

- Checkin photos and avatars reserve their space before loading (square aspect
  ratio) and keep it as an empty placeholder if the image fails, so the masonry
  balances columns against a height the card actually keeps.

- Facet option lists distinguish a failed vocabulary request from an empty one,
  showing an error with a retry instead of spinning; a failed request is no
  longer re-fired on every remount.

- Wrapped the app in Blueprint's `BlueprintProvider`, so overlays render inside
  an `OverlaysProvider` instead of Blueprint's legacy fallback.

- Added `/dev/feed`, `/dev/feed/nearby` and `/dev/feed/mine` — list-only
  checkin feeds built on `DataPanel` from `@macrostrat/data-sheet`, with
  URL-linkable search and sort state.
- `/dev/feed/nearby` carries a helper map that sets the region's center point
  (`?lat=&lng=`); the API's 100 km radius around it is fixed server-side.
- `/dev/feed/mine` reads the Rockd login stored by `/login`.
- Added `~/_utils/url-atoms` and `~/_utils/data-view-url-state` (ported from the
  `web` repo) for query-string-backed view state.
- Added semantic checkin filters — age (interval), lithology and person — as
  `?int_id=`/`?lith_id=`/`?person_id=` id lists (the same names the API uses).
  Age and lithology hold their whole vocabulary, so search is local and each
  offers common options before anything is typed. Values render with `IntervalTag`/`LithologyTag` from
  `@macrostrat/data-components`.
- The feed's whole filter surface is one wide control, left of the sort button:
  a tag field holding the applied notes term and facet values inline, with a
  dropdown that searches every facet at once. Options are grouped by the facet's
  own categories (interval rank, lithology class) under sticky headers, laid out
  as wrapped tags, and drill into a full per-facet list.
- Feed cards use the data-sheet masonry scroll body (responsive, up to three
  columns), so uneven card heights pack without gaps and paging doesn't reflow
  what's on screen. Cards are plain links to the checkin page; selection is off.
- The nearby helper map sits in a page-level column beside the feed, and renders
  before a center is chosen.
- `/dev/feed/mine` shows a non-ideal state with a login link when signed out.
- The feed pages use the site header (`Rockd › Development › Checkin feed`) over
  their own scrolling list; the site footer is part of the feed's end-of-scroll
  region, below the load progress and "Load more" checkpoint. The All /
  Nearby / Mine tabs (the site's small outlined buttons, the current feed
  shaded) stand on their own at the right end of the search row
  (the search box still wraps just the search and Sort), in line with the
  cards' right edge (`CheckinFeedPanel`'s `toolbarEnd`).
- Fixed server-rendered pages that import `@macrostrat/data-components`
  (`/checkin/@id`) failing with "Cannot require() ES Module ... in a cycle":
  `ssr.noExternal` now covers transitive `@macrostrat/*` packages, not only
  direct dependencies.
