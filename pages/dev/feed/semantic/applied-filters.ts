/**
 * What's currently filtering the feed, visible without opening anything.
 *
 * The library's built-in "Filters" tag only reports *that* a filter is active
 * and how many values it holds — the values themselves are behind the dropdown.
 * (`ActiveFiltersList` is on the `@macrostrat/data-sheet` roadmap for exactly
 * this; when it lands with a placement slot, this becomes a thin consumer of it.)
 *
 * Rendered through `DataPanel`'s `toolbar` prop, which is passed as *children*
 * of the actions toolbar — so it sits beside the Filter and Sort controls rather
 * than replacing them, and inside the provider, so it reads and writes the
 * store's `activeFilters` directly.
 *
 * Each chip removes one *value*, not the whole filter — the thing the built-in
 * tag's ✕ can't do, and the reason this is worth having.
 */
import { Button } from "@blueprintjs/core";
import { useSelector, useStoreAPI } from "@macrostrat/data-sheet";
import hyper from "@macrostrat/hyper";
import styles from "./applied-filters.module.sass";
import { SEMANTIC_FACETS, type SemanticFacet } from "./facets";
import { useFacetItems } from "./label-cache";
import { FacetTag } from "./tags";
import { isSemanticEmpty, type SemanticState } from "./controls";
import { NOTES_FILTER_ID, notesFilter, SEMANTIC_FILTER_ID, semanticFilter } from "../view-config";

const h = hyper.styled(styles);

export function AppliedFilters() {
  const store = useStoreAPI();
  const activeFilters = useSelector((s: any) => s.activeFilters);

  const semantic: SemanticState =
    activeFilters?.get(SEMANTIC_FILTER_ID)?.state ?? {};
  const notes: string = activeFilters?.get(NOTES_FILTER_ID)?.state?.text ?? "";

  const setSemantic = (next: SemanticState) => {
    if (isSemanticEmpty(next)) {
      store.getState().removeFilter(SEMANTIC_FILTER_ID);
      return;
    }
    store.getState().setFilter(SEMANTIC_FILTER_ID, semanticFilter, next);
  };

  const groups = SEMANTIC_FACETS.filter(
    (f) => (semantic[f.id] ?? []).length > 0
  ).map((facet) =>
    h(AppliedFacet, {
      key: facet.id,
      facet,
      ids: semantic[facet.id],
      onChange: (ids: number[]) => setSemantic({ ...semantic, [facet.id]: ids }),
    })
  );

  let notesChip = null;
  if (notes.trim() !== "") {
    notesChip = h(
      Button,
      {
        className: "applied-notes",
        minimal: true,
        small: true,
        icon: "search",
        rightIcon: "small-cross",
        onClick: () => store.getState().removeFilter(NOTES_FILTER_ID),
      },
      `“${notes.trim()}”`
    );
  }

  if (groups.length === 0 && notesChip == null) return null;

  return h("div.applied-filters", [notesChip, groups]);
}

function AppliedFacet({
  facet,
  ids,
  onChange,
}: {
  facet: SemanticFacet;
  ids: number[];
  onChange: (ids: number[]) => void;
}) {
  const items = useFacetItems(facet, ids);
  return h(
    "div.applied-facet",
    items.map((item) =>
      h(FacetTag, {
        key: item.id,
        facet,
        item,
        onRemove: () => onChange(ids.filter((id: number) => id !== item.id)),
      })
    )
  );
}
