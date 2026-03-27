import h from "@macrostrat/hyper";
import { SETTINGS } from "~/settings";
import React from "react";

const isProduction = SETTINGS.macrostratEnv?.toLowerCase() === "production";

export function DevGuard({ children }: { children: React.ReactNode }) {
  if (isProduction) {
    return h("div", { className: "container" }, [
      h("h1", "404"),
      h("p", "Page not found"),
    ]);
  }

  return h(React.Fragment, null, children);
}
