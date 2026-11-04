import { AnchorButton } from "@blueprintjs/core";
import { RockdSiteIcon } from "~/components";
import h from "./main.module.sass";

/** The homepage's header: the Rockd icon, and the ways into the site as
 * links. Shared with /login, which takes the homepage's layout. */
export function HomeNav() {
  return h("header.home-nav", [
    h(RockdSiteIcon, { className: "home-nav-icon" }),
    h("nav.home-nav-links", [
      h(NavLink, { href: "/explore", icon: "geosearch" }, "Explore the data"),
      h(NavLink, { href: "/trips", icon: "route" }, "Trips"),
      h(NavLink, { href: "/login", icon: "log-in" }, "Login"),
    ]),
  ]);
}

function NavLink({ href, icon, children }) {
  return h(
    AnchorButton,
    { href, icon, minimal: true, className: "home-nav-link" },
    children
  );
}
