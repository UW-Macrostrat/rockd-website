import { Button, type IconName } from "@blueprintjs/core";
import { DarkModeButton, useDarkMode } from "@macrostrat/ui-components";
import h from "./settings-panel.module.sass";

export interface MapSettingsPanelProps {
  showSatellite: boolean;
  onToggleSatellite: () => void;
  showOverlay: boolean;
  onToggleOverlay: () => void;
}

/**
 * The map pages' Settings view: theme, base map and overlay toggles, as one
 * centered column of the same outlined button. (The account, and Log out, are
 * in the sidebar header's account button.)
 */
export function MapSettingsPanel({
  showSatellite,
  onToggleSatellite,
  showOverlay,
  onToggleOverlay,
}: MapSettingsPanelProps) {
  // `DarkModeButton` stays active whenever a theme was picked by hand, Light
  // included; like the other toggles, it's active only while dark mode is on
  const inDarkMode = useDarkMode()?.isEnabled ?? false;

  return h("div.map-settings", [
    h(DarkModeButton, {
      className: "settings-button",
      active: inDarkMode,
      outlined: true,
      showText: true,
      allowReset: true,
    }),
    h(SettingsButton, {
      icon: "satellite",
      text: "Satellite",
      active: showSatellite,
      onClick: onToggleSatellite,
    }),
    h(SettingsButton, {
      icon: "map",
      text: "Overlay",
      active: showOverlay,
      onClick: onToggleOverlay,
    }),
  ]);
}

function SettingsButton({
  icon,
  text,
  active = false,
  onClick,
}: {
  icon: IconName;
  text: string;
  active?: boolean;
  onClick: () => void;
}) {
  return h(
    Button,
    { className: "settings-button", outlined: true, icon, active, onClick },
    text
  );
}
