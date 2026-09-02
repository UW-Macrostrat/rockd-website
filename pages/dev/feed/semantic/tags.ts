/**
 * One place that turns a `FacetItem` into a tag, so age and lithology render
 * with Macrostrat's shared `IntervalTag` / `LithologyTag` — same colors, same
 * shape as the lexicon and unit views — rather than a look invented here.
 *
 * Used both by the pickers (selected values) and by the applied-filters bar, so
 * a chip means the same thing wherever it appears.
 */
import { Tag as BlueprintTag } from "@blueprintjs/core";
import {
  IntervalTag,
  LithologyTag,
  TagSize,
} from "@macrostrat/data-components";
import h from "@macrostrat/hyper";
import type { FacetItem, SemanticFacet } from "./facets";

export interface FacetTagProps {
  facet: SemanticFacet;
  item: FacetItem;
  /** Renders a ✕ on the tag. */
  onRemove?: () => void;
  onClick?: () => void;
  size?: TagSize;
}

export function FacetTag({
  facet,
  item,
  onRemove,
  onClick,
  size = TagSize.Small,
}: FacetTagProps) {
  // The shared tags have no "removable" affordance, so the ✕ rides along as a
  // child — `Tag` renders children inside its main span.
  let remove = null;
  if (onRemove != null) {
    remove = h(
      "button.tag-remove",
      {
        type: "button",
        "aria-label": `Remove ${item.name}`,
        onClick: (event: any) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove();
        },
      },
      "✕"
    );
  }

  if (facet.tag === "interval") {
    return h(
      IntervalTag,
      {
        interval: {
          id: item.id,
          name: item.name,
          color: item.color ?? "#cccccc",
          b_age: item.b_age ?? 0,
          t_age: item.t_age ?? 0,
          rank: 0,
        },
        showAgeRange: false,
        size,
        onClick,
      },
      remove
    );
  }

  if (facet.tag === "lithology") {
    return h(
      LithologyTag,
      {
        data: { lith_id: item.id, name: item.name, color: item.color } as any,
        // Without a `MacrostratInteractionProvider` these are inert anyway, but
        // be explicit: a chip in a filter bar must not navigate away.
        interactive: false,
        size,
        onClick,
      },
      remove
    );
  }

  return h(
    BlueprintTag,
    { minimal: true, onRemove, onClick, interactive: onClick != null },
    item.name
  );
}
