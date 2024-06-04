import hyper from "@macrostrat/hyper";
import { DarkModeProvider } from "@macrostrat/ui-components";
import React, { useEffect } from "react";
import { PageContextProvider } from "./page-context";
import { PageContext, PageStyle } from "./types";
import { AuthProvider } from "./auth";
import { usePageContext } from "vike-react/usePageContext";

import "~/styles/blueprint-core";
import "../styles/_theme.styl";
import "../styles/core.sass";
import "../styles/padding.css";

import styles from "./page-shell.module.sass";

const h = hyper.styled(styles);

export function PageShell({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext();
  const { exports = {}, config, user } = pageContext;
  const supportsDarkMode = config?.supportsDarkMode ?? true;
  const pageStyle = exports?.pageStyle ?? "fullscreen";

  return h(
    AuthProvider,
    { user }, // Prefer detailed user if available
    h(
      supportsDarkMode ? DarkModeProvider : NoOpDarkModeProvider,
      { followSystem: true },
      h("div.app-shell", { className: pageStyle + "-page" }, children)
    )
  );
}

function NoOpDarkModeProvider(props) {
  return props.children;
}
