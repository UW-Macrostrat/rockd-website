import {
  Alert,
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
import { atomWithSearchParam, locationAtom } from "~/_utils/url-atoms";
import { useStoredRockdAuth } from "~/components/auth";
import {
  deleteOrganization,
  OrganizationAPIError,
  safeExternalURL,
  safeOrganizationColor,
  useMyOrganizationRoles,
  useOrganizations,
  type OrganizationSummary,
} from "~/organizations";
import styles from "./organizations.module.sass";

const h = hyper.styled(styles);

const searchAtom = atomWithSearchParam("q");
const visibilityAtom = atomWithSearchParam("checkins");
const sortAtom = atomWithSearchParam("sort");

type VisibilityFilter = "all" | "public" | "members";
type SortOrder = "name" | "members" | "checkins" | "recent";

function resolvedVisibility(value: string | null): VisibilityFilter {
  if (value === "public" || value === "members") return value;
  return "all";
}

function resolvedSort(value: string | null): SortOrder {
  if (value === "members" || value === "checkins" || value === "recent") {
    return value;
  }
  return "name";
}

/** A date from the API as "March 12, 2019". Empty for anything unparseable,
 * so a bad value drops the line rather than printing "Invalid Date". */
function formatOrganizationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** An organization's most recent checkin as a sortable number. Organizations
 * that have never had one sort last. */
function lastCheckinTime(organization: OrganizationSummary): number {
  if (organization.last_checkin == null) return 0;
  const time = new Date(organization.last_checkin).getTime();
  if (Number.isNaN(time)) return 0;
  return time;
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

interface OrganizationCardProps {
  organization: OrganizationSummary;
  /** True when the signed-in person administers this organization — the only
   * case where the delete control appears. */
  isAdmin: boolean;
  onDelete(organization: OrganizationSummary): void;
}

function OrganizationCard({
  organization,
  isAdmin,
  onDelete,
}: OrganizationCardProps) {
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

  let visibility = h(Tag, { minimal: true }, "Private");
  if (organization.public) {
    visibility = h(Tag, { intent: "success", minimal: true }, "Public");
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

  // Both of the next two are guarded against an API that hasn't shipped these
  // fields yet: leaving the line out is better than "undefined checkins" if
  // the site is deployed ahead of the API.
  let checkins = null;
  if (organization.checkin_count != null) {
    let checkinLabel = `${organization.checkin_count} checkins`;
    if (organization.checkin_count === 1) checkinLabel = "1 checkin";
    checkins = h("span.checkin-count", [
      h(Icon, { icon: "map-marker", size: 14, "aria-hidden": true }),
      checkinLabel,
    ]);
  }

  // How recently the organization has been used, which is what tells a visitor
  // whether it is actually active. Absent until something has been shared.
  let activity = null;
  let lastCheckin = "";
  if (organization.last_checkin != null) {
    lastCheckin = formatOrganizationDate(organization.last_checkin);
  }
  if (lastCheckin !== "") {
    activity = h("span.last-checkin", [
      h(Icon, { icon: "time", size: 14, "aria-hidden": true }),
      `Last checkin ${lastCheckin}`,
    ]);
  }

  // Sits in the card's top-right corner rather than in the flow, so it never
  // pushes the card's own content around. Icon only: a corner control has no
  // room for a label, and the confirmation it opens spells out what happens.
  let deleteButton = null;
  if (isAdmin) {
    deleteButton = h(Button, {
      className: "card-delete",
      icon: "trash",
      intent: "danger",
      minimal: true,
      small: true,
      title: `Delete ${organization.name}`,
      "aria-label": `Delete ${organization.name}`,
      onClick: () => onDelete(organization),
    });
  }

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

  // The card opens the organization's page. Only the heading and description
  // are inside the link: the meta row holds a link of its own (the website),
  // and the corner's delete control is a button — neither may nest inside an
  // anchor. `has-corner-action` reserves room beside the title so a long name
  // wraps before it reaches the button.
  let className = "organization-card";
  if (deleteButton != null) className += " has-corner-action";

  return h(Card, { className }, [
    deleteButton,
    h("a.organization-card-link", { href: `/orgs/${organization.id}` }, [
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
    ]),
    h("div.organization-meta", [
      h("span.member-count", [
        h(Icon, { icon: "person", size: 14, "aria-hidden": true }),
        memberLabel,
      ]),
      checkins,
      activity,
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

  // Every ordering falls back to the name, so organizations that tie on the
  // chosen measure still come out in a stable, readable order.
  result.sort((a, b) => {
    if (sort === "members" && a.member_count !== b.member_count) {
      return b.member_count - a.member_count;
    }
    if (sort === "checkins" && a.checkin_count !== b.checkin_count) {
      return b.checkin_count - a.checkin_count;
    }
    if (sort === "recent") {
      const difference = lastCheckinTime(b) - lastCheckinTime(a);
      if (difference !== 0) return difference;
    }
    return a.name.localeCompare(b.name);
  });
  return result;
}

/** The directory's delete flow: which organization is awaiting confirmation,
 * whether the request is in flight, and what came back if it failed. Kept out
 * of the component so the page body stays a list of named pieces. */
function useOrganizationDeletion(token: string | null, onDeleted: () => void) {
  const [target, setTarget] = useState<OrganizationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cancel() {
    if (deleting) return;
    setTarget(null);
    setError(null);
  }

  function start(organization: OrganizationSummary) {
    setTarget(organization);
    setError(null);
  }

  async function confirm() {
    if (target == null || token == null) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteOrganization(target.id, token);
      setTarget(null);
      onDeleted();
    } catch (caught) {
      let message = "Something went wrong while deleting the organization.";
      if (caught instanceof OrganizationAPIError) message = caught.message;
      setError(message);
    }
    setDeleting(false);
  }

  return { target, deleting, error, start, cancel, confirm };
}

export function OrganizationDirectory() {
  const [search, setSearch] = useAtom(searchAtom);
  const [visibilityValue, setVisibility] = useAtom(visibilityAtom);
  const [sortValue, setSort] = useAtom(sortAtom);
  const location = useAtomValue(locationAtom);
  const [refreshKey, setRefreshKey] = useState(0);
  const { organizations, error, loading } = useOrganizations(refreshKey);

  // Deleting an organization is admin-only, so the directory has to know which
  // of these the signed-in person administers. A reload of the list reloads
  // the roles with it.
  const { auth } = useStoredRockdAuth();
  const token = auth?.token ?? auth?.person?.token ?? null;
  const roles = useMyOrganizationRoles(token, refreshKey);
  const deletion = useOrganizationDeletion(token, () =>
    setRefreshKey(refreshKey + 1)
  );

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
          h(OrganizationCard, {
            key: organization.id,
            organization,
            isAdmin: roles.get(organization.id) === "admin",
            onDelete: deletion.start,
          })
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

  // Deleting cannot be undone, so it always goes through a confirmation that
  // spells out what happens to the organization's checkins.
  let deleteAlert = null;
  if (deletion.target != null) {
    deleteAlert = h(
      Alert,
      {
        isOpen: true,
        intent: "danger",
        icon: "trash",
        confirmButtonText: "Delete organization",
        cancelButtonText: "Cancel",
        loading: deletion.deleting,
        onCancel: deletion.cancel,
        onConfirm: deletion.confirm,
      },
      [
        h("p", [
          `Delete ${deletion.target.name}? Its checkins will be unassigned `,
          "and everyone will lose their membership. This cannot be undone.",
        ]),
        h(
          "p",
          "The checkins themselves are not deleted — they stay in their authors' accounts."
        ),
        h.if(deletion.error != null)("p.field-error", deletion.error),
      ]
    );
  }

  return h("div.organizations-page", [
    deleteAlert,
    h("main.organizations-main", [
      h("h1.directory-title", "Organizations"),
      h("div.directory-intro-row", [
        h(
          "p.directory-intro",
          "Discover groups sharing geological checkins in Rockd."
        ),
        h(NewOrganizationButton),
      ]),
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
                { value: "public", label: "Public" },
                { value: "members", label: "Private" },
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
                { value: "checkins", label: "Checkin count" },
                { value: "recent", label: "Recent activity" },
              ],
            }),
          ]),
        ]
      ),
      h("p.result-count", { "aria-live": "polite" }, resultCount),
      body,
    ]),
  ]);
}

/** The directory's call to action, beside its introduction (under the site
 * header's account button). */
export function NewOrganizationButton() {
  return h(
    AnchorButton,
    { href: "/orgs/new", intent: "primary", icon: "add" },
    "New organization"
  );
}
