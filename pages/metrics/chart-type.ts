import { Switch } from "@blueprintjs/core";
import h from "./main.module.sass";
import { atom, useAtom } from "jotai";

/** Whether the metrics charts draw as bars rather than lines. Shared between
 * the header's switch and the page's charts. */
export const showBarAtom = atom(false);

/** The bar/line toggle, shown in the site header (see `+headerActions.ts`). */
export function ShowBarSwitch() {
  const [showBar, setShowBar] = useAtom(showBarAtom);
  return h(Switch, {
    className: "show-bar-switch",
    checked: showBar,
    label: "Show bar charts",
    onChange: () => setShowBar(!showBar),
  });
}
