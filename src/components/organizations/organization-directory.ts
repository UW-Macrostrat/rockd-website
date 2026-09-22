import {
  AnchorButton,
  Button,
  Callout,
  Card,
  HTMLSelect,
  Icon,
  InputGroup,
  NonIdealState,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Footer, RockdSiteIcon } from "~/components";
import { atomWithSearchParam, locationAtom } from "~/_utils/url-atoms";
import {
  safeExternalURL,
  safeOrganizationColor,
  useOrganizations,
  type OrganizationSummary,
} from "~/organizations";
import styles from "./organizations.module.sass";

const h = hyper.styled(styles);

const searchAtom = atomWithSearchParam("q");
const visibilityAtom = atomWithSearchParam("checkins");
const sortAtom = atomWithSearchParam("sort");

type VisibilityFilter = "all" | "public" | "members";
type SortOrder = "name" | "members";

function resolvedVisibility(value: string | null): VisibilityFilter {
  if (value === "public" || value === "members") return value;
  return "all";
}

function resolvedSort(value: string | null): SortOrder {
  if (value === "members") return value;
  return "name";
}

function OrganizationLogo({
  organization,
}: {
  organization: OrganizationSummary;
}) {
  const [failed, setFailed] = useState(false);
  const logoURL = safeExternalURL(organization.logo_url, { httpsOnly: true });
  useEffect(() => setFailed(false), [logoURL]);
  if (logoURL == null || failed) {
    return h(
      "div.organization-logo.logo-fallback",
      { "aria-hidden": true },
      h(Icon, { icon: "people", size: 28 })
    );
  }

  return h("img.organization-logo", {
    src: logoURL,
    alt: `${organization.name} logo`,
    width: 56,
    height: 56,
    loading: "lazy",
    referrerPolicy: "no-referrer",
    onError: () => setFailed(true),
  });
}

function OrganizationCard({
  organization,
}: {
  organization: OrganizationSummary;
}) {
  let description = h(
    "p.organization-description.muted",
    "No description provided."
  );
  if (
    organization.description != null &&
    organization.description.trim() !== ""
  ) {
    description = h("p.organization-description", organization.description);
  }

  let visibility = h(Tag, { minimal: true }, "Members-only checkins");
  if (organization.public) {
    visibility = h(
      Tag,
      { intent: "success", minimal: true },
      "Public checkins allowed"
    );
  }

  let website = null;
  const websiteURL = safeExternalURL(organization.url);
  if (websiteURL != null) {
    const hostname = new URL(websiteURL).hostname;
    website = h(
      "a.organization-website",
      {
        href: websiteURL,
        target: "_blank",
        rel: "noopener noreferrer nofollow ugc",
        referrerPolicy: "no-referrer",
        "aria-label": `Visit the ${organization.name} website (opens in a new tab)`,
      },
      [hostname, h(Icon, { icon: "share", size: 12 })]
    );
  }

  let memberLabel = `${organization.member_count} members`;
  if (organization.member_count === 1) memberLabel = "1 member";

  let accent = null;
  const organizationColor = safeOrganizationColor(organization.color);
  if (organizationColor != null) {
    accent = h("span.organization-color", {
      style: { backgroundColor: organizationColor },
      title: `Organization color ${organizationColor}`,
      "aria-label": `Organization color ${organizationColor}`,
      role: "img",
    });
  }

  return h(Card, { className: "organization-card" }, [
    h("div.card-heading", [
      h(OrganizationLogo, { organization }),
      h("div.card-title", [
        h("div.organization-title-row", [
          h("h2.organization-title", organization.name),
          accent,
        ]),
        h("span.organization-slug", `@${organization.slug}`),
      ]),
    ]),
    description,
    h("div.organization-meta", [
      h("span.member-count", [
        h(Icon, { icon: "person", size: 14, "aria-hidden": true }),
        memberLabel,
      ]),
      visibility,
      website,
    ]),
  ]);
}

function filterOrganizations(
  organizations: OrganizationSummary[],
  query: string,
  visibility: VisibilityFilter,
  sort: SortOrder
): OrganizationSummary[] {
  const normalized = query.trim().toLocaleLowerCase();
  const result = organizations.filter((organization) => {
    if (visibility === "public" && !organization.public) return false;
    if (visibility === "members" && organization.public) return false;
    if (normalized === "") return true;
    const searchable = [
      organization.name,
      organization.slug,
      organization.description ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(normalized);
  });

  result.sort((a, b) => {
    if (sort === "members" && a.member_count !== b.member_count) {
      return b.member_count - a.member_count;
    }
    return a.name.localeCompare(b.name);
  });
  return result;
}

export function OrganizationDirectory() {
  const [search, setSearch] = useAtom(searchAtom);
  const [visibilityValue, setVisibility] = useAtom(visibilityAtom);
  const [sortValue, setSort] = useAtom(sortAtom);
  const location = useAtomValue(locationAtom);
  const [refreshKey, setRefreshKey] = useState(0);
  const { organizations, error, loading } = useOrganizations(refreshKey);

  const query = search ?? "";
  const visibility = resolvedVisibility(visibilityValue);
  const sort = resolvedSort(sortValue);
  const created = location.searchParams?.get("created");

  let notice = null;
  if (created != null) {
    notice = h(
      Callout,
      { intent: "success", icon: "tick", role: "status" },
      `${created} was created.`
    );
  }

  let body = null;
  if (loading) {
    body = h("div.directory-state", { role: "status" }, [
      h(Spinner),
      h("span", "Loading organizations…"),
    ]);
  } else if (error != null) {
    body = h(NonIdealState, {
      icon: "error",
      title: "Organizations couldn't be loaded",
      description: error.message,
      action: h(
        Button,
        { intent: "primary", onClick: () => setRefreshKey(refreshKey + 1) },
        "Try again"
      ),
    });
  } else if (organizations != null) {
    const filtered = filterOrganizations(
      organizations,
      query,
      visibility,
      sort
    );
    if (filtered.length === 0) {
      body = h(NonIdealState, {
        icon: "search",
        title: "No organizations found",
        description: "Try changing your search or checkin visibility filter.",
      });
    } else {
      body = h(
        "div.organization-grid",
        filtered.map((organization) =>
          h(OrganizationCard, { key: organization.id, organization })
        )
      );
    }
  }

  let resultCount = "";
  if (organizations != null) {
    const count = filterOrganizations(
      organizations,
      query,
      visibility,
      sort
    ).length;
    resultCount = `${count} organizations`;
    if (count === 1) resultCount = "1 organization";
  }

  return h("div.organizations-page", [
    h("header.organizations-header", [
      h(RockdSiteIcon, { className: "site-icon" }),
      h("div.header-title", [
        h("h1", "Organizations"),
        h("p", "Discover groups sharing geological checkins in Rockd."),
      ]),
      h(
        AnchorButton,
        { href: "/organizations/new", intent: "primary", icon: "add" },
        "New organization"
      ),
    ]),
    h("main.organizations-main", [
      notice,
      h(
        "section.directory-controls",
        { "aria-label": "Organization filters" },
        [
          h("label.search-control", [
            h("span.control-label", "Search organizations"),
            h(InputGroup, {
              value: query,
              leftIcon: "search",
              placeholder: "Search by name or description",
              onChange: (event) => setSearch(event.currentTarget.value),
            }),
          ]),
          h("label.select-control", [
            h("span.control-label", "Checkin visibility"),
            h(HTMLSelect, {
              fill: true,
              value: visibility,
              onChange: (event) => {
                const value = event.currentTarget.value;
                if (value === "all") setVisibility(null);
                else setVisibility(value);
              },
              options: [
                { value: "all", label: "All organizations" },
                { value: "public", label: "Public checkins allowed" },
                { value: "members", label: "Members-only checkins" },
              ],
            }),
          ]),
          h("label.select-control", [
            h("span.control-label", "Sort by"),
            h(HTMLSelect, {
              fill: true,
              value: sort,
              onChange: (event) => {
                const value = event.currentTarget.value;
                if (value === "name") setSort(null);
                else setSort(value);
              },
              options: [
                { value: "name", label: "Name" },
                { value: "members", label: "Member count" },
              ],
            }),
          ]),
        ]
      ),
      h("p.result-count", { "aria-live": "polite" }, resultCount),
      body,
    ]),
    h(Footer),
  ]);
}
