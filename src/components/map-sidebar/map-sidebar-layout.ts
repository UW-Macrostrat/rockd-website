import { Button, IconName } from "@blueprintjs/core";
import {
  FloatingNavbar,
  MapAreaContainer,
  PanelCard,
} from "@macrostrat/map-interface";
import "@macrostrat/map-interface/dist/map-interface.css";
import { ReactNode } from "react";
import { UserPersona } from "../auth";
import { RockdSiteIcon } from "../site-icon";
import h from "./map-sidebar.module.sass";

export interface MapSidebarLayoutProps {
  /** The sidebar's heading */
  title: string;
  /** The sidebar's body */
  sidebar: ReactNode;
  /** Page-specific controls in the header, ahead of Settings and close */
  tools?: ReactNode;
  /** Shows a Settings button */
  onToggleSettings?: () => void;
  /** Shows a close button */
  onClose?: () => void;
  /** The page's own logout, for the account button's Log out */
  onLogout?: () => void;
  /** The map, and anything that works with it */
  children: ReactNode;
}

/**
 * The standard layout for Rockd's map pages: `MapAreaContainer` from
 * `@macrostrat/map-interface` with a sidebar in its `navbar` and
 * `contextPanel` slots, as Macrostrat's map pages have — a header with the
 * Rockd icon, the title, the page's controls and the account button, over a
 * scrolling body.
 */
export function MapSidebarLayout({
  title,
  sidebar,
  tools,
  onToggleSettings,
  onClose,
  onLogout,
  children,
}: MapSidebarLayoutProps) {
  return h(
    MapAreaContainer,
    {
      className: "map-sidebar-layout",
      navbar: h(MapSidebarHeader, {
        title,
        tools,
        onToggleSettings,
        onClose,
        onLogout,
      }),
      contextPanel: h(PanelCard, { className: "map-sidebar-panel" }, sidebar),
    },
    children
  );
}

function MapSidebarHeader({
  title,
  tools,
  onToggleSettings,
  onClose,
  onLogout,
}: Omit<MapSidebarLayoutProps, "sidebar" | "children">) {
  return h(FloatingNavbar, {
    className: "map-sidebar-header",
    headerElement: h("div.sidebar-title", [
      h(RockdSiteIcon, { className: "site-icon" }),
      h("h1.page-title", title),
    ]),
    rightElement: h("div.tools", [
      tools,
      h.if(onToggleSettings != null)(ToolButton, {
        icon: "cog",
        onClick: onToggleSettings,
      }),
      // As at the content pages' header's end, icon-only to fit; close stays
      // outermost
      h(UserPersona, { compact: true, onLogout }),
      h.if(onClose != null)(ToolButton, { icon: "cross", onClick: onClose }),
    ]),
  });
}

function ToolButton({
  icon,
  onClick,
}: {
  icon: IconName;
  onClick: () => void;
}) {
  return h(Button, { icon, minimal: true, onClick });
}
