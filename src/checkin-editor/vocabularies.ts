/**
 * The vocabularies an observation is described in, from where the app gets
 * them: Macrostrat's `/defs` routes and the Paleobiology Database. Lithologies
 * and intervals come through `@macrostrat/data-provider`, shared with the
 * pickers; minerals and structures aren't in the provider, so they're loaded
 * here (small lists, fetched whole), and strat names and taxa are searched
 * remotely, as their vocabularies are too large to hold.
 *
 * Every hook distinguishes "loading" from "failed" — the feed note's lesson:
 * a null that means both turns one bad request into a spinner forever.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { macrostratApiURL } from "~/settings";
import type {
  LngLat,
  MineralRef,
  StratNameRef,
  StructureRef,
  TaxonRef,
  IntervalRef,
  LithologyRef,
  MapUnitRef,
} from "./types";

// A fallback keeps a server render without the env var from throwing at import
export const MACROSTRAT_API = `${(
  macrostratApiURL ?? "https://macrostrat.org"
).replace(/\/$/, "")}/api/v2`;
const PBDB_API = "https://paleobiodb.org/data1.2";
export const PBDB_THUMB = `${PBDB_API}/taxa/thumb.png?taxon_id=`;

export interface Loadable<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

async function fetchMacrostrat<T>(
  path: string,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(`${MACROSTRAT_API}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Macrostrat request failed (${res.status})`);
  const body = await res.json();
  const data = body?.success?.data;
  if (data == null) throw new Error("Macrostrat returned no data");
  return data as T;
}

// ---- Whole vocabularies, cached for the page's life ----

const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  let pending = cache.get(key) as Promise<T> | undefined;
  if (pending == null) {
    pending = load().catch((error) => {
      // A failure must not be remembered as the answer
      cache.delete(key);
      throw error;
    });
    cache.set(key, pending);
  }
  return pending;
}

function useCachedList<T>(
  key: string,
  load: () => Promise<T[]>
): Loadable<T[]> {
  const [state, setState] = useState<Loadable<T[]>>({
    data: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    let live = true;
    setState({ data: null, loading: true, error: null });
    cached(key, load).then(
      (data) => live && setState({ data, loading: false, error: null }),
      (error) => live && setState({ data: null, loading: false, error })
    );
    return () => {
      live = false;
    };
  }, [key]);
  return state;
}

export function useMinerals(): Loadable<MineralRef[]> {
  return useCachedList("minerals", () =>
    fetchMacrostrat<MineralRef[]>("/defs/minerals?all")
  );
}

export function useStructures(): Loadable<StructureRef[]> {
  return useCachedList("structures", () =>
    fetchMacrostrat<StructureRef[]>("/defs/structures?all")
  );
}

// ---- Remote search ----

/** A debounced remote search: the query settles, then one request, with a
 * stale response dropped. */
function useSearch<T>(
  query: string,
  search: (q: string, signal: AbortSignal) => Promise<T[]>,
  minLength = 2
): Loadable<T[]> {
  const [state, setState] = useState<Loadable<T[]>>({
    data: [],
    loading: false,
    error: null,
  });
  const latest = useRef(0);
  useEffect(() => {
    const q = query.trim();
    if (q.length < minLength) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    const id = ++latest.current;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    const timer = setTimeout(() => {
      search(q, controller.signal).then(
        (data) => {
          if (id !== latest.current) return;
          setState({ data, loading: false, error: null });
        },
        (error) => {
          if (id !== latest.current || error?.name === "AbortError") return;
          setState({ data: [], loading: false, error });
        }
      );
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return state;
}

export function useStratNameSearch(query: string): Loadable<StratNameRef[]> {
  return useSearch(query, async (q, signal) => {
    const rows = await fetchMacrostrat<any[]>(
      `/defs/strat_names?strat_name_like=${encodeURIComponent(q)}`,
      signal
    );
    return rows.slice(0, 30).map((row) => ({
      ...row,
      strat_name_id: Number(row.strat_name_id),
      strat_name_long: row.strat_name_long ?? `${row.strat_name} ${row.rank}`,
    }));
  });
}

export function useTaxonSearch(query: string): Loadable<TaxonRef[]> {
  return useSearch(query, async (q, signal) => {
    const url = `${PBDB_API}/taxa/auto.json?vocab=pbdb&limit=15&taxon_name=${encodeURIComponent(
      q
    )}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`PBDB request failed (${res.status})`);
    const body = await res.json();
    // As the app stores a taxon: the PBDB record with `oid`/`name` added
    return (body?.records ?? []).map((record: any) => ({
      ...record,
      oid: Number(
        record.taxon_no ?? String(record.oid ?? "").replace("txn:", "")
      ),
      name: record.taxon_name ?? record.nam,
      rank: record.taxon_rank ?? record.rnk,
    }));
  });
}

// ---- Nearby geology ----

export interface NearbyGeology {
  map_units: MapUnitRef[];
  strat_names: StratNameRef[];
  lithologies: LithologyRef[];
  intervals: IntervalRef[];
}

/** What Macrostrat knows around a point — the map units under it and the
 * names, lithologies and ages they carry — as the app offers them first in
 * each picker. */
export function useNearbyGeology(
  position: LngLat | null
): Loadable<NearbyGeology> {
  // Three decimals (~100 m) is plenty for "nearby", and stops a pin nudged
  // by a pixel from refetching
  const key = useMemo(() => {
    if (position == null) return null;
    return `${position.lng.toFixed(3)},${position.lat.toFixed(3)}`;
  }, [position?.lng, position?.lat]);

  const [state, setState] = useState<Loadable<NearbyGeology>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (key == null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const [lng, lat] = key.split(",");
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    fetchMacrostrat<any>(
      `/geologic_units/burwell/nearby?lng=${lng}&lat=${lat}&referrer=rockd`,
      controller.signal
    ).then(
      (data) =>
        setState({
          data: {
            map_units: data?.map_units ?? [],
            strat_names: data?.strat_names ?? [],
            lithologies: data?.lithologies ?? [],
            intervals: data?.intervals ?? [],
          },
          loading: false,
          error: null,
        }),
      (error) => {
        if (error?.name === "AbortError") return;
        setState({ data: null, loading: false, error });
      }
    );
    return () => controller.abort();
  }, [key]);

  return state;
}
