# Changelog

## Unreleased

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
- The site footer is part of the feed's end-of-scroll region, below the load
  progress and "Load more" checkpoint.
- Fixed server-rendered pages that import `@macrostrat/data-components`
  (`/checkin/@id`) failing with "Cannot require() ES Module ... in a cycle":
  `ssr.noExternal` now covers transitive `@macrostrat/*` packages, not only
  direct dependencies.
