/**
 * One place that turns a `FacetItem` into a tag, so age and lithology render
 * with Macrostrat's shared `IntervalTag` / `LithologyTag` — same colors, same
 * shape as the lexicon and unit views — rather than a look invented here.
 *
 * These *are* the tags: they render directly, not nested inside a Blueprint
 * `Tag`. (That's why the omni control doesn't use Blueprint's `TagInput`, which
 * always wraps each value in a tag of its own — a tag inside a tag.) The remove
 * affordance rides in the shared tag's own `details` slot, which both tags
 * expose and neither uses here.
 *
 * Used by the control and by every option list, so a chip means the same thing
 * wherever it appears.
 */
import { Icon, Tag as BlueprintTag } from "@blueprintjs/core";
import {
  IntervalTag,
  LithologyTag,
  TagSize,
} from "@macrostrat/data-components";
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import styles from "./tags.module.sass";
import type { FacetItem, SemanticFacet } from "./facets";

const h = hyper.styled(styles);

export interface FacetTagProps {
  facet: SemanticFacet;
  item: FacetItem;
  /** Adds a ✕ in the tag's details slot. */
  onRemove?: () => void;
  onClick?: () => void;
  /** Marks the tag as part of the current selection (in an option list). */
  selected?: boolean;
  size?: TagSize;
  className?: string;
}

export function FacetTag({
  facet,
  item,
  onRemove,
  onClick,
  selected = false,
  size = TagSize.Small,
  className,
}: FacetTagProps) {
  let details = null;
  if (onRemove != null) {
    details = h(
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
      h(Icon, { icon: "small-cross", size: 12 })
    );
  }

  const shared = {
    details,
    size,
    onClick,
    className: classNames(className, "facet-tag", { selected }),
  };

  if (facet.tag === "interval") {
    return h(IntervalTag, {
      interval: {
        id: item.id,
        name: item.name,
        color: item.color ?? "#cccccc",
        b_age: item.b_age ?? 0,
        t_age: item.t_age ?? 0,
        rank: 0,
      },
      // `details` below carries the ✕ instead; the age range is in the title.
      showAgeRange: false,
      ...shared,
    });
  }

  if (facet.tag === "lithology") {
    return h(LithologyTag, {
      data: { lith_id: item.id, name: item.name, color: item.color } as any,
      // Without a `MacrostratInteractionProvider` these are inert anyway, but
      // be explicit: a tag in a filter control must not navigate away.
      interactive: false,
      ...shared,
    });
  }

  return h(
    BlueprintTag,
    {
      minimal: true,
      onRemove,
      onClick,
      interactive: onClick != null,
      className: classNames(className, { selected }),
    },
    item.name
  );
}
