import { Button } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import styles from "./back-button.module.sass";

const h = hyper.styled(styles);

export interface BackButtonProps {
  /** Where to go when there's no page before this one (it was opened
   * directly, or in a new tab) */
  fallback: string;
  className?: string;
}

/**
 * "← Back", at a page's top left: back to the page before, or to `fallback`
 * when the page was opened directly. Safe on server-rendered pages: the
 * client router is loaded only when it's needed.
 */
export function BackButton({ fallback, className }: BackButtonProps) {
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    import("vike/client/router").then(({ navigate }) => navigate(fallback));
  }
  return h(
    Button,
    {
      icon: "arrow-left",
      minimal: true,
      onClick: goBack,
      className: classNames(styles["back-button"], className),
    },
    "Back"
  );
}
