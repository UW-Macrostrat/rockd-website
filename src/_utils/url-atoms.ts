import { atom } from "jotai";
import { atomWithLocation } from "jotai-location";

/**
 * jotai-location helpers for syncing view state to the URL *query string* — the
 * repo convention (see AGENTS.md) for shareable/bookmarkable page state.
 *
 * Ported from the Macrostrat `web` repo's `~/_utils/url-atoms`, which the
 * heatmap page notes the absence of. If a third page needs these, they belong in
 * a shared package rather than a second copy.
 */

/**
 * Shared app location atom, synced to the browser URL. `replace: true` so that
 * view-state param updates replace the current history entry rather than
 * flooding the back/forward stack.
 */
export const locationAtom = atomWithLocation({ replace: true });

/**
 * A read/write atom backed by a single URL query parameter. Writing `null` (or
 * `""`) removes the parameter, keeping default views out of the URL.
 */
export function atomWithSearchParam(key: string) {
  return atom(
    (get) => get(locationAtom).searchParams?.get(key) ?? null,
    (get, set, value: string | null) => {
      const loc = get(locationAtom);
      const searchParams = new URLSearchParams(loc.searchParams);
      if (value == null || value === "") {
        searchParams.delete(key);
      } else {
        searchParams.set(key, value);
      }
      set(locationAtom, { ...loc, searchParams });
    }
  );
}
