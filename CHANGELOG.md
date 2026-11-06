# Changelog

## Unreleased

- `/dev` lists every page in the development section (behind its dev guard),
  each by title with its URL, found from the `+Page` files under `pages/dev`
  so new pages appear on their own. The Development breadcrumb now leads there.
  A second section lists the other pages whose `+guard.ts` is the production
  guard (403 outside development), found the same way: `/heatmap`, `/login`
  and its sub-pages, `/my-checkins` and `/orgs`.
- Removed `/login/strabojwt`, the original StraboSpot account-linking page
  (StraboSpot redirected there with `?j=<jwt>`). StraboSpot no longer uses it;
  linking happens on `/dev/strabospot` through `strabospot.org/rockd_login`.
- **Checkin editing on the web** (`/dev/create-edit-checkin`, signed-in users): the app's
  create/edit flow as pages, so new features can be prototyped here before the
  mobile app.
  - `/dev/create-edit-checkin/new` creates a checkin; `/dev/create-edit-checkin/:id` edits one of your
    own; `/dev/create-edit-checkin` lists edits kept in this browser (the app's "Unsynced"
    feed). Laid out as `/orgs` is: a "Checkins" title, then an introduction
    with Your checkins and New checkin at the row's right end, then the
    Unsaved edits section. Breadcrumbs: Rockd › Development › Edit checkins.
    Both editor pages are the one `CheckinEditor`, with Back at the top left
    (the page before, or `/dev/create-edit-checkin` when opened directly); an existing
    checkin opens prefilled, titled by its id (Rockd › Development › Edit
    checkins › 43766, and in the browser tab). A page's `title` may be a
    function of the page context (`+title.ts`), which the site header calls.
  - The editor (`~/components/checkin-editor`): description, star rating (five
    spaced stars), date observed, private, organization (from your
    memberships), location (the `/checkin/:id` page's map — square, at its
    regional view — typed coordinates or the browser's position, with the
    server's place name) and photo. The checkin's fields are in three titled
    groups — Outcrop (the description, with an example placeholder and a note
    that its first line is the title), Details (rating, observed, visibility
    and organization on a two-column grid) and Location (the map beside
    labelled latitude and longitude, Use my location and the place) — each
    control labelled above it, in the page's font, with aligned figures in the
    date and coordinates. The save column is one box: the status after a
    coloured dot (green saved, amber unsaved changes, grey not yet saved), then
    every action stacked as full-width buttons of one size — Save and, once
    saved, View checkin (in a new tab) and Delete checkin under it. Unsaved
    edits stay as a draft rather than being discarded. Observations are cards with the app's four
    modules — rocks (stratigraphic name, map unit, age, lithologies with
    attributes), fossils (PBDB taxa), minerals, structure (strike/dip,
    trend/plunge with uncertainties, feature) — each collapsible, plus a photo
    and an optional location of its own.
  - Vocabularies come from `@macrostrat/data-components` pickers
    (`LithologyPicker`, `TagPicker`) over `@macrostrat/data-provider`
    (`MacrostratDataProvider`), with minerals and structures loaded from
    Macrostrat's `/defs` routes, stratigraphic names searched on Macrostrat,
    taxa on the Paleobiology Database, and map units from Macrostrat's nearby
    geology at the checkin's location. The age picker lists the ages of the
    map units there first, marked "Nearby", as the app's picker does.
  - A chosen photo's EXIF is read in the browser (`~/checkin-editor/exif`): its
    position and date are offered for the checkin, as the app's EXIF prompt
    does. JPEGs upload as-is; other formats are re-encoded through a canvas.
  - Saving follows the app's two-phase sync (`~/checkin-editor/sync`): one
    `POST /protected/checkin` for the checkin and its observations, then one
    `POST /protected/photos` per new photo with retries; failed photos can be
    retried without re-saving. The draft reloads from the server after a save,
    so ids are the server's. Delete, with confirmation, as in the app.
  - Unsaved edits are kept in `localStorage` per checkin and offered back on
    return. The draft model and its operations are pure functions
    (`~/checkin-editor`), and `syncCheckins` runs over a list, for bulk editing
    to build on.
- Signed in, the `/dev/feed` pages show New checkin in the header, as the
  same blue button `/dev/create-edit-checkin` has (the `/dev/create-edit-checkin` pages' header has
  only the sign-in indicator, as `/orgs` does), every card ends in a Details
  link to its page with Edit to its right on your own, and a checkin page you
  own has Edit in its
  header. New checkin and Unsaved edits are reached from `/dev`, not the
  account panel. A shared `useRockdAuth` hook (`~/components/auth`) reads the
  stored login once for every component.
- `@macrostrat/data-components` 1.10 (the pickers) and
  `@macrostrat/data-provider` 1.4 added.

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
  and email, "My checkins", "Integrations" (`/dev/strabospot`) and Log out; signed out, "Sign in", opening a
  panel that links to `/login`. Either way the panel links to Explore and
  Trips (with the footer's icons), the Feed and Organizations. It's at the top right of the `/dev/feed` and
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
  StraboSpot's sent badge sits after a card's star rating rather than over it
  (`MapCheckinCardBody`'s `badge`).
- `/dev/strabospot` resyncs. Sending a checkin again (same checkin_id and
  spot_id) updates its spot and photos in StraboSpot, so already-sent
  checkins can be selected too, to carry an edit ("N selected (M already
  sent, to update)"). Photos that didn't reach StraboSpot are remembered by
  id per checkin in `localStorage` (`strabospot-photo-failures`, across
  reloads): their card shows an amber ! instead of ✓ and an "N photos didn't
  sync — Resync" row, and the footer offers "Resync them" for all of them.
  Resync uploads only those photos (api-v3 `POST
  /dev/convert/resync-strabo-photos`), not the spot or the photos already
  there; a photo that fails again stays recorded for the next try. Needs
  api-v3's per-photo `imageFailures` in the sync response.

- The checkin page (`/checkin/{id}`) is rebuilt from the site's components,
  under the header "Rockd › Checkin": Back at the top left (the page before,
  or home when opened directly — the editor's button, now the shared
  `BackButton` in `~/components`), then the checkin's title (its notes' first
  line) as the page heading, a long one cut short at a sentence or word with
  a clickable "…" that shows it all (`TruncatedText`); the checkin as its
  card shows it (byline and
  rating, description, photo, place and counts; `checkin-card-parts`) beside
  a "Location" card whose map of where it is matches the photo's size and
  place (`LocationMap`: the map pages' base map, Macrostrat overlay and blue
  pin, scrolling with the page); its observations as a grid
  of cards (photo, then, centered, a small table of strike, dip and dip
  direction with its compass point, Macrostrat tags, notes and location;
  the photo page shows the same details); and its comments. Photos open the
  photo page. It replaces the static map image and full-screen map overlay.

- The photo page (`/photo/{id}`) uses the content layout ("Rockd › Photo"):
  a "← Checkin" link back to its checkin, the checkin's title as the heading
  (cut short if long, as on the checkin page), the photo as large
  as fits, then previous (left), a dot per photo of the checkin — each a link,
  the current one filled, with "3 of 11" — and next (right); the arrow keys
  step through them too. Below, a card of what the photo shows: an
  observation's details as on the checkin page, or, for the checkin's own
  photo, the checkin's byline, notes, place and counts. The photo list no
  longer test-loads every image first.

- Standard page chrome shared with the Macrostrat website. A page's
  `pageStyle` config picks a layout from `~/layouts` (`home`, `content`,
  `fullscreen`). `content` pages get `SitePageHeader` — `PageHeader` from
  `@macrostrat/ui-components` with the Rockd logo and a breadcrumb trail
  ending in the page's `title` (`Rockd › Section › Page`) on one row; a page's
  `headerActions` config adds header controls — and the new Macrostrat-style
  `Footer` (link lists, credits and a hydration-safe `ThemeButton`). Terms,
  Privacy, Metrics, Organizations and the checkin page use the `content`
  layout and the homepage
  the `home` layout, replacing their hand-built headers and footers; the
  Metrics "Show bar charts" switch sits in its header. Upgraded
  `@macrostrat/ui-components` to 5.5.0 and imported its stylesheet.

- The homepage is compressed into a centered column (960px): a header with the
  Rockd icon and "Explore the data", "Trips" and "Login" as links; the field
  photo as a banner behind the wordmark, tagline and app badges beside the
  app's screens; then each section as tall as its content, its text and
  pictures side by side (the Dashboard and progress sections as rounded
  boxes). The full-screen sections and their "Next page" buttons are gone.
- `/login` takes the homepage's layout: the same column, header (`HomeNav`,
  now in `pages/index/home-nav.ts`) and footer, with the login form in the
  banner in place of the app badges. The banner has no photo behind it and
  takes the theme's panel colors, and the app's screens beside the form are
  larger (up to 480px). Its Login button matches the header's
  Login link (icon and bold label), in gray with a thin gray border and roomy
  padding around them, centered under the fields, and a transparent gray
  hover the same in either theme. The email and password fields take the
  theme's colors, and keep them when the browser autofills them. The green
  hero-button styles, no longer used
  anywhere, are gone. `/login/callback` keeps its full-window layout.

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
  With a center picked, the map sits at the top of the list's scroll, under
  the pinned search bar, and scrolls away with the cards; before one is
  picked it keeps its own row above the prompt.
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
- The nearby helper map is the site's `LocationMap` (the checkin page's: the
  standard base map, Macrostrat overlay and blue pin), in a page-level row
  above the search, as wide as the cards' row. A click picks the center, a
  located center is brought into view, and it renders before a center is
  chosen. The feed takes the page's width rather than its content's, so it
  no longer runs off a narrow page.
- `/dev/feed/mine` shows a non-ideal state with a login link when signed out.
- The feed pages use the site header (`Rockd › Development › Feed`) over
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
