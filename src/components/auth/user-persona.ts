import {
  AnchorButton,
  Button,
  Divider,
  Icon,
  PopoverNext,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { exploreNavItems, type NavLinkItem } from "../footer";
import {
  clearRockdAuth,
  type RockdLoginPayload,
  useStoredRockdAuth,
} from "./rockd-auth";
import styles from "./user-persona.module.sass";

const h = hyper.styled(styles);

export interface UserPersonaProps {
  /** Icon only; the name shows on hover and in the panel. For a crowded
   * toolbar, like the map pages' sidebar header. */
  compact?: boolean;
  /** What Log out does beyond clearing the login (and reloading the page) —
   * a page's own logout, which may clear more */
  onLogout?: () => void;
  className?: string;
}

/**
 * The standard sign-in indicator, as Macrostrat's `UserPersona`: signed in it
 * shows the user's name, signed out it reads "Sign in". Clicking opens a panel
 * with the user's name and email, links around the site (Explore, Trips, the
 * checkin feed, Organizations), and their checkins and Log out — or, signed
 * out, Sign in and the same links.
 */
export function UserPersona({
  compact = false,
  onLogout,
  className,
}: UserPersonaProps) {
  const { checked, auth } = useStoredRockdAuth();

  let icon: "user" | "blocked-person" = "blocked-person";
  let text: string | null = "Sign in";
  let title = "Not signed in";
  if (auth != null) {
    icon = "user";
    text = displayName(auth);
    title = `Signed in as ${text}`;
  }
  if (compact) text = null;

  // Until the login is read, hold the space without claiming either state
  if (!checked) {
    return h(Button, {
      className: classNames("user-persona", className),
      minimal: true,
      icon: "user",
      disabled: true,
    });
  }

  // `PopoverNext` (floating-ui), as Macrostrat's persona uses; the older
  // `Popover` lands at the page's corner here
  return h(
    PopoverNext,
    {
      content: h(UserPanel, { auth, onLogout }),
      placement: "bottom-end",
      minimal: true,
    },
    h(Button, {
      className: classNames("user-persona", className),
      icon,
      minimal: true,
      text,
      title,
      "aria-label": title,
    })
  );
}

function UserPanel({
  auth,
  onLogout,
}: {
  auth: RockdLoginPayload | null;
  onLogout?: () => void;
}) {
  if (auth == null) return h(SignedOutPanel);
  return h(SignedInPanel, { auth, onLogout });
}

// Where the panel leads, whether or not anyone's signed in: the footer's
// Explore and Trips (with its icons), the checkin feed and organizations
const siteLinks: NavLinkItem[] = [
  ...exploreNavItems.filter(
    (item) => item.href === "/explore" || item.href === "/trips"
  ),
  { href: "/dev/feed", text: "Checkin feed", icon: "feed" },
  { href: "/orgs", text: "Organizations", icon: "people" },
];

function SiteLinks() {
  return h(
    "div.user-panel-actions",
    siteLinks.map(({ href, text, icon }) =>
      h(AnchorButton, { key: href, minimal: true, icon, href }, text)
    )
  );
}

function SignedOutPanel() {
  return h("div.user-panel", [
    h("div.user-panel-header", [
      h(Icon, { icon: "blocked-person", size: 20 }),
      h("div.user-panel-identity", [
        h("div.user-panel-name", "Not signed in"),
      ]),
    ]),
    h(
      AnchorButton,
      { href: "/login", icon: "log-in", intent: "primary" },
      "Sign in"
    ),
    h(Divider),
    h(SiteLinks),
  ]);
}

function SignedInPanel({
  auth,
  onLogout,
}: {
  auth: RockdLoginPayload;
  onLogout?: () => void;
}) {
  function logOut() {
    clearRockdAuth();
    if (onLogout != null) {
      onLogout();
      return;
    }
    window.location.reload();
  }

  return h("div.user-panel", [
    h("div.user-panel-header", [
      h(Icon, { icon: "user", size: 20 }),
      h("div.user-panel-identity", [
        h("div.user-panel-name", displayName(auth)),
        h.if(auth.person?.email != null)(
          "div.user-panel-detail",
          auth.person?.email
        ),
      ]),
    ]),
    h(Divider),
    h(SiteLinks),
    h(Divider),
    h("div.user-panel-actions", [
      h(
        AnchorButton,
        { minimal: true, icon: "map-marker", href: "/my-checkins" },
        "My checkins"
      ),
      h(
        Button,
        { minimal: true, icon: "log-out", intent: "danger", onClick: logOut },
        "Log out"
      ),
    ]),
  ]);
}

function displayName(auth: RockdLoginPayload): string {
  const { first_name, last_name } = auth.person ?? {};
  const name = [first_name, last_name].filter(Boolean).join(" ").trim();
  if (name !== "") return name;
  return "Signed in";
}
