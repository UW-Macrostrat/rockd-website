import { BlueprintProvider } from "@blueprintjs/core";
import { DarkModeProvider } from "@macrostrat/ui-components";
import { ReactNode } from "react";
import "@macrostrat/style-system";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import { usePageContext } from "vike-react/usePageContext";

import "~/styles/core.sass";
import "~/styles/padding.css";
import h from "./+Layout.module.sass";

export default function Layout({ children }: { children: ReactNode }) {
  const pageContext = usePageContext();
  const { exports = {} } = pageContext;
  const pageStyle = exports?.pageStyle ?? "fullscreen";

  // Blueprint's composite provider (overlays + portals + hotkeys). Every
  // `Popover`/`Dialog` here renders through `Overlay2`, which warns
  // ("<Overlay2> was used outside of a <OverlaysProvider> context") and loses
  // its managed overlay stack without it — so escape/outside-click and focus
  // ordering were being handled by the legacy fallback.
  return h(
    BlueprintProvider,
    h(
      DarkModeProvider,
      { followSystem: true },
      h("div.app-shell", { className: pageStyle + "-page" }, children)
    )
  );
}
