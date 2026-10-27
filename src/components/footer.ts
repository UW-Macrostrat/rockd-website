import { AnchorButton } from "@blueprintjs/core";
import { isValidElement, ReactNode } from "react";
import { ThemeButton } from "./theme-button";
import h from "./footer.module.sass";

export interface NavLinkItem {
  href: string;
  text: string;
  icon?: any;
}

/** The site's canonical link sets, the same ones Macrostrat's footer draws
 * from. Anything that shows site navigation should use these rather than
 * forking the list. */
export const exploreNavItems: NavLinkItem[] = [
  { href: "/", text: "Home", icon: "home" },
  { href: "/explore", text: "Explore", icon: "geosearch" },
  { href: "/heatmap", text: "Heatmap", icon: "map" },
];

export const aboutNavItems: NavLinkItem[] = [
  { href: "/terms", text: "Terms and Conditions", icon: "manual" },
  { href: "/privacy", text: "Privacy", icon: "lock" },
  {
    href: "https://itunes.apple.com/us/app/id1153056624",
    text: "iOS app",
    icon: "mobile-phone",
  },
  {
    href: "https://play.google.com/store/apps/details?id=org.macrostrat.rockd",
    text: "Android app",
    icon: "mobile-phone",
  },
];

const repoURL = "https://github.com/UW-Macrostrat/rockd-website";

export function Footer({ className }: { className?: string }) {
  const externalLinks = [
    { href: "https://macrostrat.org", text: "Macrostrat", icon: "globe" },
    {
      href: "https://github.com/UW-Macrostrat",
      text: "GitHub",
      icon: "git-repo",
    },
    {
      href: "https://strata.geology.wisc.edu",
      text: "Macrostrat lab",
      icon: "office",
    },
  ];

  const actions = [
    h(ThemeButton, { key: "theme", className: "nav-link-button" }),
    { href: repoURL + "/issues", text: "Report an issue", icon: "bug" },
  ];

  // The inner box lays out against the footer's width (a container query)
  return h("footer.footer", { className }, [
    h("div.footer-inner", [
      h(HomepageLink),
      h(NavLinkList, { items: exploreNavItems, title: "Explore" }),
      h(NavLinkList, { items: aboutNavItems, title: "About" }),
      h(NavLinkList, { items: externalLinks, title: "Links" }),
      h(NavLinkList, { items: actions, title: "Actions" }),
    ]),
    h(FooterCredits),
  ]);
}

function HomepageLink() {
  return h(
    "a.homepage-link",
    { href: "/", onClick: scrollToTopOnHomepage, "aria-label": "Rockd home" },
    [
      h("h3", "Rockd"),
      // The same icon as the page header's logo
      h("img.footer-logo", { src: "/rockd-icon-256.png", alt: "" }),
    ]
  );
}

function FooterCredits() {
  return h("div.footer-credits", [
    h("p", [
      "Produced by ",
      h("a", { href: "https://macrostrat.org" }, "Macrostrat"),
      ". Funded by ",
      h("a", { href: "https://nsf.gov" }, "NSF"),
      ", the ",
      h("a", { href: "https://aapgfoundation.org" }, "AAPG Foundation"),
      " and the ",
      h(
        "a",
        { href: "https://geoscience.wisc.edu" },
        "University of Wisconsin–Madison Department of Geoscience"
      ),
      ".",
    ]),
  ]);
}

function NavLinkList({
  items,
  title,
}: {
  items: (NavLinkItem | ReactNode)[];
  title?: string;
}) {
  return h("div.link-list-container", [
    h.if(title != null)("h4.link-list-title", title),
    h("ul.nav-link-list", items.map(renderNavLinkItem)),
  ]);
}

function renderNavLinkItem(item: NavLinkItem | ReactNode) {
  if (isValidElement(item)) {
    return h("li.nav-link-item", { key: item.key }, item);
  }
  const { href, text, icon } = item as NavLinkItem;
  return h(
    "li.nav-link-item",
    { key: href },
    h(
      AnchorButton,
      { href, className: "nav-link-button", icon, minimal: true },
      h("span.nav-link-text", text)
    )
  );
}

/** On the homepage the logo link scrolls back to the top instead. */
function scrollToTopOnHomepage(evt) {
  if (window.location.pathname != "/") return;
  evt.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
