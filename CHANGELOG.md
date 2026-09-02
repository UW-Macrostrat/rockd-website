# Changelog

## Unreleased

- Added `/dev/feed`, `/dev/feed/nearby` and `/dev/feed/mine` — list-only
  checkin feeds built on `DataPanel` from `@macrostrat/data-sheet`, with
  URL-linkable search and sort state.
- `/dev/feed/nearby` carries a helper map that sets the region's center point
  (`?lat=&lng=`); the API's 100 km radius around it is fixed server-side.
- `/dev/feed/mine` reads the Rockd login stored by `/login`.
- Added `~/_utils/url-atoms` and `~/_utils/data-view-url-state` (ported from the
  `web` repo) for query-string-backed view state.
- Added semantic checkin filters — age (interval), lithology and person — as
  `?age=`/`?lith=`/`?person=` id lists, behind one dropdown with a segmented
  type selector. Values render with `IntervalTag`/`LithologyTag` from
  `@macrostrat/data-components`.
- Active filter values are shown in the feed toolbar, each removable
  individually, without opening the filter dropdown.
- Feed cards are laid out as a responsive grid (2–3 per row on a wide page).
- The nearby helper map sits in the panel sidebar, beside the feed.
- Fixed server-rendered pages that import `@macrostrat/data-components`
  (`/checkin/@id`) failing with "Cannot require() ES Module ... in a cycle":
  `ssr.noExternal` now covers transitive `@macrostrat/*` packages, not only
  direct dependencies.
