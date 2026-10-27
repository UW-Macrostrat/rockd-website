import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { Spinner } from "@blueprintjs/core";
import { usePageTransitionStore } from "~/renderer/usePageTransitionStore";
import classNames from "classnames";
import { useTransition } from "transition-hook";
import { Footer, SitePageHeader } from "~/components";
import type { SitePageHeaderProps } from "~/components";

const h = hyper.styled(styles);

/* Page layouts, following those of the Macrostrat web interface. A page picks
 * one with its `pageStyle` config; see `pageLayouts` below. */

export function BasePage({ children, className, fitViewport = false }) {
  const inPageTransition = usePageTransitionStore(
    (state) => state.inPageTransition
  );

  const loadingTransition = useTransition(inPageTransition, 300);

  return h(
    "div.base-page",
    {
      className: classNames(className, { "fit-viewport": fitViewport }),
    },
    [
      children,
      h.if(loadingTransition.shouldMount)(
        "div.page-transition",
        { className: `page-transition-${loadingTransition.stage}` },
        h("div.page-transition-content", h(Spinner))
      ),
    ]
  );
}

/** Map and other full-window pages, which draw their own chrome. */
export function FullscreenPage({ children, className }) {
  return h(
    BasePage,
    { className: classNames("fullscreen-page", className) },
    children
  );
}

/** `header` sits outside the content column, so a sticky bar's background
 * and rule span the page while its content keeps the column's measure. */
export function BaseContentPage({ children, className, header = null }) {
  return h(BasePage, { className: classNames("content-page", className) }, [
    header,
    h("div.content-page-inner", children),
  ]);
}

/** The site header for a content page, spanning the page (see `BaseContentPage`). */
export function ContentPageHeader(props: SitePageHeaderProps) {
  return h(SitePageHeader, {
    width: "constrained",
    variant: "hybrid",
    ...props,
    className: classNames("content-page-header", props.className),
  });
}

/** A standard page: the site header, a centred content column and the footer.
 * `title` overrides the page's `title` config, for pages whose title comes
 * from their data. */
export function ContentPage({
  children,
  className,
  title,
}: {
  children?: any;
  className?: string;
  title?: string;
}) {
  return h(
    BaseContentPage,
    { className, header: h(ContentPageHeader, { title }) },
    [h("div.main", children), h(Footer)]
  );
}

export function CenteredContentPage({ children, className }) {
  return h(
    ContentPage,
    { className: classNames("centered", className) },
    children
  );
}

/** The homepage: full-bleed sections that carry the site title themselves,
 * then the footer. */
export function HomePage({ children, className }) {
  return h(BasePage, { className: classNames("home-page", className) }, [
    children,
    h(Footer),
  ]);
}

export const pageLayouts = {
  home: HomePage,
  content: ContentPage,
  fullscreen: FullscreenPage,
};
