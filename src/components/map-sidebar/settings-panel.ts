import { Button, type IconName } from "@blueprintjs/core";
import { DarkModeButton } from "@macrostrat/ui-components";
import h from "./settings-panel.module.sass";

export interface MapSettingsPanelProps {
  showSatellite: boolean;
  onToggleSatellite: () => void;
  showOverlay: boolean;
  onToggleOverlay: () => void;
  /** Shows a Logout button, for pages behind a sign-in */
  onLogout?: () => void;
}

/**
 * The map pages' Settings view: theme, base map and overlay toggles, and
 * Logout where the page has a signed-in user — one centered column of the
 * same outlined button.
 */
export function MapSettingsPanel({
  showSatellite,
  onToggleSatellite,
  showOverlay,
  onToggleOverlay,
  onLogout,
}: MapSettingsPanelProps) {
  return h("div.map-settings", [
    h(DarkModeButton, {
      className: "settings-button",
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
    h.if(onLogout != null)(SettingsButton, {
      icon: "log-out",
      text: "Logout",
      onClick: onLogout,
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
