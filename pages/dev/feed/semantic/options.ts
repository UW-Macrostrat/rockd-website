/**
 * Where a facet's options come from, and how a query narrows them.
 *
 * One hook covers both facet shapes (see `facets.ts`): a held vocabulary is
 * fetched once per session and filtered locally — instant, and it answers
 * `commonOptions` before anything is typed — while an open-ended facet falls
 * back to a debounced remote search that has nothing to offer on an empty query.
 *
 * The vocabulary is cached as a *promise* at module scope, so several panels
 * mounting at once share one request rather than racing.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FacetItem, SemanticFacet } from "./facets";
import { useRecordItems } from "./label-cache";

const SEARCH_DEBOUNCE = 250;

const vocabularies = new Map<string, Promise<FacetItem[]>>();

/**
 * The shared vocabulary request for a facet.
 *
 * A *rejected* promise stays cached on purpose. The upstream failure mode here
 * is a 10-second connect timeout (a Macrostrat API with no database), and
 * dropping the cache entry on failure meant every remount of the panel fired
 * another 10-second request — an endless spinner that also hammers a service
 * that is already struggling. A failure is sticky until `retryVocabulary`.
 */
export function loadVocabulary(
  facet: SemanticFacet
): Promise<FacetItem[]> | null {
  if (facet.vocabulary == null) return null;
  let pending = vocabularies.get(facet.id);
  if (pending == null) {
    // No caller signal: the result is shared, so one consumer unmounting must
    // not cancel it for the others.
    pending = facet.vocabulary(new AbortController().signal);
    vocabularies.set(facet.id, pending);
  }
  return pending;
}

/** Forget a cached vocabulary (including a failed one) so the next read
 * re-requests it. */
export function retryVocabulary(facet: SemanticFacet) {
  vocabularies.delete(facet.id);
}

export interface FacetOptions {
  items: FacetItem[];
  loading: boolean;
  /** The vocabulary or search request failed. Shown as an error with a retry
   * rather than an empty list — "no matching lithologies" would be a lie when
   * the truth is that nothing could be fetched. */
  error: Error | null;
  /** Re-request after a failure. */
  retry(): void;
  /** The facet holds its whole vocabulary, so `items` is everything that
   * matches rather than a remote page of guesses. */
  complete: boolean;
}

/** Options for a facet under the current query. `limit` caps the list for a
 * summary view; omit it for the full "all options" panel. */
export function useFacetOptions(
  facet: SemanticFacet,
  query: string,
  limit?: number
): FacetOptions {
  const [vocabulary, setVocabulary] = useState<FacetItem[] | null>(null);
  const [remote, setRemote] = useState<FacetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const record = useRecordItems();
  const hasVocabulary = facet.vocabulary != null;

  const retry = useCallback(() => {
    retryVocabulary(facet);
    setError(null);
    setAttempt((n) => n + 1);
  }, [facet]);

  useEffect(() => {
    if (!hasVocabulary) return;
    let live = true;
    const pending = loadVocabulary(facet);
    setLoading(true);
    pending
      ?.then((items) => {
        if (!live) return;
        setVocabulary(items);
        setError(null);
        setLoading(false);
        // Every id this facet can hold is now labelled, so no chip that comes
        // from a URL ever needs a resolve request.
        record(facet, items);
      })
      .catch((err) => {
        if (!live) return;
        setVocabulary([]);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [facet, hasVocabulary, record, attempt]);

  // Remote search, for a facet with no vocabulary.
  const term = query.trim();
  const recordRef = useRef(record);
  recordRef.current = record;

  useEffect(() => {
    if (hasVocabulary || facet.search == null) return;
    if (term.length < 2) {
      setRemote([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      facet
        .search!(term, controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          setRemote(items);
          setLoading(false);
          recordRef.current(facet, items);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        });
    }, SEARCH_DEBOUNCE);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [facet, hasVocabulary, term, attempt]);

  const items = useMemo(() => {
    if (!hasVocabulary) return limit == null ? remote : remote.slice(0, limit);

    const all = vocabulary ?? [];
    let matched: FacetItem[];
    if (term === "") {
      matched = facet.commonOptions?.(all) ?? all;
    } else {
      const q = term.toLowerCase();
      matched = all
        .filter((d) => d.name.toLowerCase().includes(q))
        // A prefix match is nearly always the one meant.
        .sort((a, b) => {
          const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1;
          const bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
          if (ap !== bp) return ap - bp;
          return (b.weight ?? 0) - (a.weight ?? 0);
        });
    }
    if (limit == null) return matched;
    return matched.slice(0, limit);
  }, [hasVocabulary, vocabulary, remote, term, facet, limit]);

  return { items, loading, error, retry, complete: hasVocabulary };
}

/** The same options, split into the facet's sections, for the "all" panel. */
export function groupOptions(
  facet: SemanticFacet,
  items: FacetItem[]
): { group: string; items: FacetItem[] }[] {
  const byGroup = new Map<string, FacetItem[]>();
  for (const item of items) {
    const group = item.group ?? "other";
    const list = byGroup.get(group) ?? [];
    list.push(item);
    byGroup.set(group, list);
  }
  const declared = facet.groupOrder ?? [];
  const rest = [...byGroup.keys()]
    .filter((g) => !declared.includes(g))
    .sort();
  return [...declared, ...rest]
    .filter((g) => (byGroup.get(g) ?? []).length > 0)
    .map((group) => ({
      group,
      items: (byGroup.get(group) ?? []).sort(
        (a, b) => (b.weight ?? 0) - (a.weight ?? 0)
      ),
    }));
}
