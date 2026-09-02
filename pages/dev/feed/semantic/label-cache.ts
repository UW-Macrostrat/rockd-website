/**
 * Id → label cache for the semantic facets.
 *
 * **Why this is separate from filter state.** A facet filter's state is
 * `{ ids }` and nothing else. The obvious alternative — carrying
 * `{ id, name }` pairs in the filter — would mean that labelling a filter
 * restored from a URL *changes the view state*, and the data-sheet loader keys
 * its window on `JSON.stringify({sorts, filters})`. Every resolved name would
 * invalidate that key and re-fetch the whole feed, for a change that is purely
 * cosmetic. Keeping labels in a cache beside the store means the first request
 * a linked view issues is the right one, and names stream in afterwards without
 * touching the loader.
 *
 * It also keeps the URL honest: `?age=63,17` says what the query *is*. Names in
 * the URL would be a second copy of the truth, able to go stale.
 */
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import type { FacetItem, SemanticFacet } from "./facets";

type CacheKey = string;

const cacheAtom = atom<Record<CacheKey, FacetItem>>({});
/** Ids already looked up — including ones that resolved to nothing — so a
 * missing or unresolvable id is requested once, not on every render. */
const attemptedAtom = atom<Set<CacheKey>>(new Set<CacheKey>());

const keyOf = (facetId: string, id: number): CacheKey => `${facetId}:${id}`;

/** Record items the app already has in hand (search results, a vocabulary), so
 * selecting something never needs a second request to label it. */
export function useRecordItems() {
  const setCache = useSetAtom(cacheAtom);
  return useMemo(
    () => (facet: SemanticFacet, items: FacetItem[]) => {
      if (items.length === 0) return;
      setCache((cache) => {
        const next = { ...cache };
        for (const item of items) next[keyOf(facet.id, item.id)] = item;
        return next;
      });
    },
    [setCache]
  );
}

/**
 * The items for a set of ids, resolving any that aren't cached yet. Unresolved
 * ids come back as a placeholder (`Person 8105`) rather than disappearing, so a
 * chip is always removable even when its name can't be fetched.
 */
export function useFacetItems(
  facet: SemanticFacet,
  ids: number[]
): FacetItem[] {
  const cache = useAtomValue(cacheAtom);
  const attempted = useAtomValue(attemptedAtom);
  const setCache = useSetAtom(cacheAtom);
  const setAttempted = useSetAtom(attemptedAtom);

  const idKey = ids.join(",");

  useEffect(() => {
    if (facet.resolve == null) return;
    const missing = ids.filter(
      (id) =>
        cache[keyOf(facet.id, id)] == null &&
        !attempted.has(keyOf(facet.id, id))
    );
    if (missing.length === 0) return;

    // Marked before the request, so a re-render mid-flight doesn't re-issue it.
    setAttempted((prev) => {
      const next = new Set(prev);
      for (const id of missing) next.add(keyOf(facet.id, id));
      return next;
    });

    const controller = new AbortController();
    facet
      .resolve(missing, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setCache((prev) => {
          const next = { ...prev };
          for (const item of items) next[keyOf(facet.id, item.id)] = item;
          return next;
        });
      })
      .catch(() => {
        // An unresolvable id keeps its placeholder; it stays in `attempted`, so
        // a failing service isn't retried on every render.
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facet, idKey]);

  return useMemo(
    () =>
      ids.map(
        (id) =>
          cache[keyOf(facet.id, id)] ?? {
            id,
            name: `${facet.name} ${id}`,
          }
      ),
    [cache, facet, idKey]
  );
}
