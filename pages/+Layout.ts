import { BlueprintProvider } from "@blueprintjs/core";
import { DarkModeProvider } from "@macrostrat/ui-components";
import { ReactNode } from "react";
import "@macrostrat/style-system";
// The shared page header and other `@macrostrat/ui-components` styles
import "@macrostrat/ui-components/style.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import "@blueprintjs/core/lib/css/blueprint.css";

import { usePageContext } from "vike-react/usePageContext";

import "~/styles/core.sass";
import "~/styles/padding.css";
import h from "@macrostrat/hyper";
import { FullscreenPage, pageLayouts } from "~/layouts";

export default function Layout({ children }: { children: ReactNode }) {
  const pageContext = usePageContext();
  const pageStyle = pageContext.config.pageStyle ?? "fullscreen";
  // The site's standard chrome (header, footer, content column) for this
  // page, from its `pageStyle` config
  const layout = pageLayouts[pageStyle] ?? FullscreenPage;

  // Blueprint's composite provider (overlays + portals + hotkeys). Every
  // `Popover`/`Dialog` here renders through `Overlay2`, which warns
  // ("<Overlay2> was used outside of a <OverlaysProvider> context") and loses
  // its managed overlay stack without it — so escape/outside-click and focus
  // ordering were being handled by the legacy fallback.
  return h(
    BlueprintProvider,
    h(DarkModeProvider, { followSystem: true }, h(layout, children))
  );
}
