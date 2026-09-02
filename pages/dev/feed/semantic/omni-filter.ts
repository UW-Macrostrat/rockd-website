/**
 * One control for every way of narrowing the feed.
 *
 * A single input holds what's already applied — the notes term and each selected
 * interval / lithology / person, as inline tags — and typing in it queries *all*
 * facets at once. The dropdown shows what the query matches, grouped by facet
 * and, within a facet, by its own categories (interval rank, lithology class)
 * under sticky headers, so a long first category never hides the rest. With an
 * empty query each facet offers a generous slice of its vocabulary, because
 * showing the vocabulary *is* the point of the panel.
 *
 * This replaces three separate surfaces — an inline notes search, a Filter menu,
 * and a separate applied-filters bar. The tags *are* the applied-filters
 * display, which is why the bar could go: they sit where you'd go to change
 * them.
 *
 * The control is hand-rolled rather than a Blueprint `TagInput` because that
 * wraps every value in a `Tag` of its own, and these values are already tags —
 * `IntervalTag` / `LithologyTag`, which carry their own colors and their own
 * remove slot (see `tags.ts`).
 *
 * Underneath it drives the two ordinary `TableFilter`s (notes and semantics)
 * through the store, so translation, URL sync and the loader are unchanged. The
 * panel's own Filter menu is switched off (`filters: []`) — this is its
 * replacement, not an addition.
 */
import {
  ALL_CARDINALITIES,
  type TableAction,
  useSelector,
  useStoreAPI,
} from "@macrostrat/data-sheet";
import {
  Button,
  Icon,
  MenuItem,
  NonIdealState,
  PanelStack,
  PopoverNext,
  Spinner,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./omni-filter.module.sass";
import {
  facetById,
  SEMANTIC_FACETS,
  type FacetItem,
  type SemanticFacet,
} from "./facets";
import { groupOptions, useFacetOptions } from "./options";
import { useFacetItems } from "./label-cache";
import { FacetTag } from "./tags";
import {
  isSemanticEmpty,
  NOTES_FILTER_ID,
  notesFilter,
  SEMANTIC_FILTER_ID,
  semanticFilter,
  type SemanticState,
} from "../view-config";

const h = hyper.styled(styles);

/**
 * Live filter state for the dropdown's panels.
 *
 * `PanelStack` snapshots its panel objects when they enter the stack, so a
 * `renderPanel` closure would keep whatever `query` and selection existed at
 * that moment — options would stop updating as you type, and a pushed panel
 * would toggle against a stale selection. Reading through context instead lets
 * every `renderPanel` be a stable component reference.
 */
interface OmniCtx {
  query: string;
  semantic: SemanticState;
  toggle(facet: SemanticFacet, item: FacetItem): void;
  searchNotes(): void;
}

const OmniContext = createContext<OmniCtx | null>(null);

function useOmni(): OmniCtx {
  const ctx = useContext(OmniContext);
  if (ctx == null) throw new Error("Missing OmniContext");
  return ctx;
}

/** Stable: the panels read everything live from context. */
const ROOT_PANEL = { renderPanel: SummaryPanel, title: "Filter" };

/**
 * Rendered as a consumer *action* rather than through `DataPanel`'s `toolbar`
 * prop: the toolbar's children slot sits after the built-in contextual actions
 * (so the search box landed to the right of Sort), while consumer actions are
 * merged ahead of them — `[...actions, ...coreActions]` — and keep that order in
 * the toolbar. This is the search box's rightful place: first, and wide.
 */
export const omniFilterAction: TableAction<any> = {
  id: "omni-filter",
  name: "Search",
  icon: "search",
  targets: ALL_CARDINALITIES,
  requiresEditable: false,
  render: () => h(OmniFilter),
};

export function OmniFilter() {
  const store = useStoreAPI();
  const activeFilters = useSelector((s: any) => s.activeFilters);
  const [query, setQuery] = useState("");
  const [isOpen, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  /** Did an event come from the control or the panel? A click on either is use,
   * not dismissal. */
  const isInside = useCallback((node: any) => {
    if (!(node instanceof Node)) return false;
    return (
      controlRef.current?.contains(node) === true ||
      panelRef.current?.contains(node) === true
    );
  }, []);

  const semantic: SemanticState =
    activeFilters?.get(SEMANTIC_FILTER_ID)?.state ?? {};
  const notes: string = activeFilters?.get(NOTES_FILTER_ID)?.state?.text ?? "";

  const setSemantic = useCallback(
    (next: SemanticState) => {
      if (isSemanticEmpty(next)) {
        store.getState().removeFilter(SEMANTIC_FILTER_ID);
        return;
      }
      store.getState().setFilter(SEMANTIC_FILTER_ID, semanticFilter, next);
    },
    [store]
  );

  const setNotes = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed === "") {
        store.getState().removeFilter(NOTES_FILTER_ID);
        return;
      }
      store.getState().setFilter(NOTES_FILTER_ID, notesFilter, {
        text: trimmed,
      });
    },
    [store]
  );

  const toggle = useCallback(
    (facet: SemanticFacet, item: FacetItem) => {
      const ids = semantic[facet.id] ?? [];
      let next: number[];
      if (ids.includes(item.id)) {
        next = ids.filter((d) => d !== item.id);
      } else {
        next = [...ids, item.id];
      }
      setSemantic({ ...semantic, [facet.id]: next });
      // The query has done its job once something is picked, and clearing it
      // returns the panel to the browsable vocabulary.
      setQuery("");
    },
    [semantic, setSemantic]
  );

  const tags = useTagDescriptors(semantic, notes);

  const removeTag = useCallback(
    (tag: TagDescriptor) => {
      if (tag.kind === "notes") {
        setNotes("");
        return;
      }
      const ids = (semantic[tag.facet.id] ?? []).filter(
        (d) => d !== tag.itemId
      );
      setSemantic({ ...semantic, [tag.facet.id]: ids });
    },
    [semantic, setSemantic, setNotes]
  );

  const onKeyDown = useCallback(
    (event: any) => {
      if (event.key === "Enter" && query.trim() !== "") {
        setNotes(query);
        setQuery("");
        return;
      }
      // Backspace on an empty query peels off the last applied filter, the
      // familiar behavior of a tag field.
      if (event.key === "Backspace" && query === "" && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
        return;
      }
      if (event.key === "ArrowDown") {
        setOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setOpen(false);
        event.currentTarget.blur();
      }
    },
    [query, tags, setNotes, removeTag]
  );

  const ctxValue = useMemo<OmniCtx>(
    () => ({
      query: query.trim(),
      semantic,
      toggle,
      searchNotes: () => {
        setNotes(query);
        setQuery("");
      },
    }),
    [query, semantic, toggle, setNotes]
  );

  return h(
    PopoverNext,
    {
      className: "omni-popover-target",
      // NOT the bare string: `hyper.styled` rewrites the `className` prop only,
      // so any *other* prop carrying a class name has to be resolved through
      // the style module by hand — otherwise it stays a literal that matches
      // nothing, and the panel gets no width (it renders as a bare vertical
      // line).
      popoverClassName: styles["omni-popover"],
      isOpen,
      // `PopoverNext` flips two defaults relative to the legacy `Popover`, and
      // together they make a loop that this control is the perfect victim of
      // (Blueprint's own migration note calls the second one out):
      //
      //   `openOnTargetFocus` (default true) opens on focus; the target *click*
      //   that produced the focus then toggles it shut; closing with
      //   `shouldReturnFocusOnClose` (default true) puts focus back on the
      //   input; that focus opens it again — forever, paced by the transition.
      //
      // So: neither focus nor blur may drive this popover. Opening is explicit
      // (mousedown, typing, ArrowDown) and closing is dismissal.
      openOnTargetFocus: false,
      shouldReturnFocusOnClose: false,
      // Only *closing* is delegated, and only from outside: a click on the
      // control or within the panel is use, not dismissal.
      onInteraction: (next: boolean, e?: any) => {
        if (next) return;
        if (e != null && isInside(e.target)) return;
        setOpen(false);
      },
      placement: "bottom-start",
      minimal: true,
      arrow: false,
      // Floating-UI middleware, NOT popper `modifiers` — `PopoverNext` ignores
      // the latter. `minimal` disables the offset middleware, so the gap
      // between control and panel has to re-enable it explicitly.
      middleware: { offset: { mainAxis: 6 } },
      popoverRef: panelRef,
      // The control keeps focus while the panel is used — a dropdown holding a
      // form must not pull focus out of the input that opened it.
      autoFocus: false,
      enforceFocus: false,
      content: h(
        OmniContext.Provider,
        { value: ctxValue },
        h(
          "div.omni-panel",
          h(PanelStack, {
            className: "omni-stack",
            initialPanel: ROOT_PANEL,
            showPanelHeader: true,
            renderActivePanelOnly: false,
          })
        )
      ),
    },
    h(
      "div.omni-control",
      {
        ref: controlRef,
        onMouseDown: (event: any) => {
          setOpen(true);
          // Clicking the padding focuses the input rather than doing nothing,
          // but a click on a tag's ✕ must not steal focus back.
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          inputRef.current?.focus();
        },
      },
      [
        h(Icon, { className: "omni-icon", icon: "search" }),
        tags.map((tag, i) =>
          h(
            "span.omni-tag",
            { key: `${tag.kind}-${i}` },
            tag.render(() => removeTag(tag))
          )
        ),
        h("input.omni-text", {
          ref: inputRef,
          type: "text",
          value: query,
          placeholder: tags.length === 0 ? "Search checkins…" : "",
          onChange: (e: any) => {
            setQuery(e.target.value);
            setOpen(true);
          },
          onKeyDown,
        }),
      ]
    )
  );
}

// ---- Tags in the control ----

interface BaseTag {
  render(onRemove: () => void): any;
}
type TagDescriptor =
  | (BaseTag & { kind: "notes" })
  | (BaseTag & { kind: "facet"; facet: SemanticFacet; itemId: number });

/** The applied filters, as the nodes the control renders inline. */
function useTagDescriptors(
  semantic: SemanticState,
  notes: string
): TagDescriptor[] {
  // One hook call per facet, in a fixed order — `SEMANTIC_FACETS` is a module
  // constant, so this is a stable hook sequence.
  const perFacet = SEMANTIC_FACETS.map((facet) => ({
    facet,
    items: useFacetItems(facet, semantic[facet.id] ?? []),
  }));

  const tags: TagDescriptor[] = [];
  if (notes.trim() !== "") {
    tags.push({
      kind: "notes",
      render: (onRemove) =>
        h("span.notes-tag", [
          h(Icon, { icon: "search", size: 11 }),
          h("span.notes-text", notes),
          h(
            "button.tag-remove",
            { type: "button", "aria-label": "Clear search", onClick: onRemove },
            h(Icon, { icon: "small-cross", size: 12 })
          ),
        ]),
    });
  }
  for (const { facet, items } of perFacet) {
    for (const item of items) {
      tags.push({
        kind: "facet",
        facet,
        itemId: item.id,
        render: (onRemove) => h(FacetTag, { facet, item, onRemove }),
      });
    }
  }
  return tags;
}

// ---- Dropdown panels ----

function SummaryPanel({ openPanel }: any) {
  const { query, searchNotes } = useOmni();

  let notesRow = null;
  if (query !== "") {
    notesRow = h(
      Button,
      {
        className: "notes-row",
        minimal: true,
        alignText: "left",
        fill: true,
        icon: "search",
        onClick: searchNotes,
      },
      ["Search notes for ", h("strong", `“${query}”`)]
    );
  }

  return h("div.omni-root", [
    notesRow,
    h(
      "div.omni-scroll",
      SEMANTIC_FACETS.map((facet) =>
        h(FacetSection, { key: facet.id, facet, openPanel })
      )
    ),
  ]);
}

function FacetSection({ facet, openPanel }: any) {
  const { query } = useOmni();
  const { items, loading, error, retry, complete } = useFacetOptions(
    facet,
    query,
    facet.summaryLimit
  );

  // Only the facet id crosses into the pushed panel; everything live comes from
  // context, so the panel can't go stale.
  const openAll = () =>
    openPanel({
      renderPanel: AllOptionsPanel,
      props: { facetId: facet.id },
      title: facet.name,
    });

  // Only a facet that holds its vocabulary has a complete list to show.
  let viewAll = null;
  if (complete) {
    viewAll = h(Button, {
      className: "section-more",
      minimal: true,
      small: true,
      rightIcon: "chevron-right",
      text: "All",
      onClick: openAll,
    });
  }

  return h("section.facet-section", [
    h("header.facet-header", [h("span.facet-name", facet.name), viewAll]),
    h(OptionGroups, { facet, items, loading, error, retry }),
  ]);
}

function AllOptionsPanel({ facetId }: any) {
  const { query } = useOmni();
  const facet = facetById(facetId)!;
  // No search field of its own: this panel is for browsing and picking, seeded
  // by whatever is in the control above it — which stays focused and editable
  // while the panel is open, so typing there narrows this list.
  const { items, loading, error, retry } = useFacetOptions(facet, query);

  let hint = null;
  if (query !== "") {
    hint = h("div.panel-hint", [
      `Matching “${query}” — `,
      h("span.hint-quiet", "clear the search above to see everything"),
    ]);
  }

  return h("div.all-options", [
    hint,
    h(
      "div.omni-scroll",
      h(OptionGroups, { facet, items, loading, error, retry, all: true })
    ),
  ]);
}

/** A facet's options, split into its own categories under sticky headers. */
function OptionGroups({
  facet,
  items,
  loading,
  error,
  retry,
  all = false,
}: any) {
  const { semantic, toggle } = useOmni();
  const selected = semantic[facet.id] ?? [];
  const groups = useMemo(() => groupOptions(facet, items), [facet, items]);

  if (loading && items.length === 0) {
    return h("div.section-status", h(Spinner, { size: 16 }));
  }

  // An upstream failure is not an empty vocabulary. Saying "no matching
  // lithologies" when nothing could be fetched sends people looking for a
  // filter bug that isn't theirs.
  if (error != null && items.length === 0) {
    const message = h([
      h("span.status-error", `Couldn't load ${facet.pluralName}.`),
      h(Button, { minimal: true, small: true, onClick: retry }, "Retry"),
    ]);
    if (all) {
      return h(NonIdealState, {
        icon: "error",
        title: `Couldn't load ${facet.pluralName}`,
        description: error.message,
        action: h(Button, { onClick: retry }, "Retry"),
      });
    }
    return h("div.section-status", message);
  }

  if (items.length === 0) {
    let text = `No matching ${facet.pluralName}`;
    if (facet.vocabulary == null) {
      text = `Type to search ${facet.pluralName}`;
    }
    if (all) {
      return h(NonIdealState, { icon: "search", title: text });
    }
    return h("div.section-status", text);
  }

  // A facet with a single category doesn't need a header for it.
  const showGroupHeaders = groups.length > 1;

  return h(
    "div.option-groups",
    groups.map(({ group, items: groupItems }) =>
      h("div.option-group", { key: group }, [
        h.if(showGroupHeaders)("div.group-header", group),
        h(OptionList, { facet, items: groupItems, selected, onToggle: toggle }),
      ])
    )
  );
}

function OptionList({ facet, items, selected, onToggle }: any) {
  if (facet.optionLayout === "rows") {
    return h(
      "div.option-rows",
      items.map((item: FacetItem) =>
        h(MenuItem, {
          key: item.id,
          className: "option-row",
          icon: selected.includes(item.id) ? "tick" : "blank",
          text: item.name,
          label: item.detail,
          shouldDismissPopover: false,
          onClick: () => onToggle(facet, item),
        })
      )
    );
  }

  // Inline: the tags wrap, which fits several times as many options on screen
  // as a row each — and for a colored, recognizable label that's the better
  // read anyway.
  return h(
    "div.option-inline",
    items.map((item: FacetItem) =>
      h(FacetTag, {
        key: item.id,
        facet,
        item,
        selected: selected.includes(item.id),
        onClick: () => onToggle(facet, item),
      })
    )
  );
}
