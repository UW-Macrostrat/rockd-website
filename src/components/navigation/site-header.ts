import classNames from "classnames";
import { ReactNode } from "react";
import { usePageContext } from "vike-react/usePageContext";
import {
  PageHeader,
  type PageHeaderProps,
  type Crumb,
} from "@macrostrat/ui-components";
import h from "./site-header.module.sass";

export type SitePageHeaderProps = Omit<PageHeaderProps, "logo" | "breadcrumbs">;

/** Titles of the site's sections, keyed by path, for the ancestors in a page's
 * trail. A page's own title comes from its `title` config. Add an entry when a
 * section gains child pages. */
export const siteSections: Record<string, string> = {
  "/orgs": "Organizations",
  "/dev": "Development",
};

/**
 * Rockd's page header: `PageHeader` (`@macrostrat/ui-components`, the same
 * header Macrostrat's site uses) filled from the route — the Rockd logo, a
 * trail of the page's ancestor sections, and the page's `title` config.
 * Layout options (`variant`, `sticky`, `width`, `actions`, `title`, …) pass
 * through. A page's (or subtree's) `headerActions` config leads the action
 * slot, ahead of any `actions` passed here.
 *
 * When sticky (always, for `hybrid`), the header's parent is its sticky
 * boundary, so render it as a direct child of the page or scroll container.
 */
export function SitePageHeader(props: SitePageHeaderProps) {
  const { className, actions, title, ...rest } = props;
  const ctx = usePageContext();
  const PageActions = ctx.config.headerActions;

  let headerActions: ReactNode = actions;
  if (PageActions != null) {
    headerActions = h([h(PageActions, { key: "page" }), actions]);
  }

  return h(PageHeader, {
    breadcrumbs: usePageBreadcrumbs(),
    title: title ?? ctx.config.title,
    logo: h(SiteLogo),
    titleAlignment: "left",
    actions: headerActions,
    className: classNames("site-page-header", className),
    ...rest,
  });
}

/** The trail ahead of the current page: the site root, then each enclosing
 * section listed in `siteSections`. Set like the other crumbs, so only the
 * current page's title stands out. */
export function usePageBreadcrumbs(): Crumb[] {
  const { urlPathname } = usePageContext();
  const root: Crumb = { text: "Rockd", href: "/" };
  return [root, ...sectionCrumbs(urlPathname)];
}

function sectionCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter((s) => s.length > 0);
  // Ancestors only: the last segment is the current page.
  const prefixes = segments
    .slice(0, -1)
    .map((_, i) => "/" + segments.slice(0, i + 1).join("/"));
  return prefixes
    .filter((href) => siteSections[href] != null)
    .map((href) => ({ text: siteSections[href], href }));
}

function SiteLogo() {
  return h(
    "a.site-logo",
    { href: "/", "aria-label": "Rockd home" },
    h("img", { src: "/rockd-icon-256.png", alt: "" })
  );
}
