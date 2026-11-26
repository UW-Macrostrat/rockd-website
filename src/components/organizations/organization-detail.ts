/**
 * One organization's page (`/orgs/:id`), reached by clicking a card in the
 * directory. Everything on it comes from `GET /orgs/:id` and that
 * organization's roster — no new endpoints.
 *
 * Membership is a request, never a self-service join: pressing Join writes a
 * `requested` row and an admin approves it from their profile page (or from
 * the roster here). The button below therefore reflects four states — signed
 * out, no row, requested-and-waiting, and in — rather than being a toggle.
 */
import {
  Alert,
  AnchorButton,
  Button,
  Callout,
  Card,
  Icon,
  NonIdealState,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { useStoredRockdAuth } from "~/components/auth";
import {
  leaveOrganization,
  OrganizationAPIError,
  removeMember,
  requestMembership,
  safeExternalURL,
  safeOrganizationColor,
  setMemberRole,
  useOrganization,
  type OrganizationDetail,
  type OrganizationMember,
} from "~/organizations";
import styles from "./organizations.module.sass";

const h = hyper.styled(styles);

/** A date from the API as "March 12, 2019"; empty for anything unparseable. */
function formatDate(value: string | null): string {
  if (value == null) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function displayName(member: OrganizationMember): string {
  const name = [member.first_name, member.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (name !== "") return name;
  return `Person ${member.person_id}`;
}

export interface OrganizationPageProps {
  /** The `:id` from the URL — an id or a slug; the API resolves either. */
  id: string;
}

export function OrganizationPage({ id }: OrganizationPageProps) {
  const { auth } = useStoredRockdAuth();
  const token = auth?.token ?? auth?.person?.token ?? null;
  const [refreshKey, setRefreshKey] = useState(0);
  const { organization, members, error, loading } = useOrganization(
    id,
    token,
    refreshKey
  );

  const reload = () => setRefreshKey(refreshKey + 1);

  if (loading) {
    return h("main.organization-main", [
      h("div.directory-state", { role: "status" }, [
        h(Spinner),
        h("span", "Loading organization…"),
      ]),
    ]);
  }

  if (error != null || organization == null) {
    let description = "This organization could not be loaded.";
    if (error instanceof OrganizationAPIError && error.status === 404) {
      description = "There is no organization at this address.";
    } else if (error != null) {
      description = error.message;
    }
    return h(
      "main.organization-main",
      h(NonIdealState, {
        icon: "error",
        title: "Organization not found",
        description,
        action: h(
          AnchorButton,
          { href: "/orgs", icon: "arrow-left" },
          "All organizations"
        ),
      })
    );
  }

  return h("main.organization-main", [
    h(AnchorButton, {
      className: "organization-back",
      href: "/orgs",
      icon: "arrow-left",
      minimal: true,
      text: "Organizations",
    }),
    h(OrganizationHeader, { organization }),
    h(MembershipPanel, { organization, token, onChange: reload }),
    h(OrganizationFacts, { organization }),
    h(Roster, { organization, members, token, onChange: reload }),
  ]);
}

// ---- Heading ----

function OrganizationHeader({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  let accent = null;
  const color = safeOrganizationColor(organization.color);
  if (color != null) {
    accent = h("span.organization-color", {
      style: { backgroundColor: color },
      role: "img",
      "aria-label": `Organization color ${color}`,
    });
  }

  let description = null;
  if (
    organization.description != null &&
    organization.description.trim() !== ""
  ) {
    description = h("p.organization-lede", organization.description);
  }

  return h("header.organization-header", [
    h("div.organization-title-row", [
      h("h1.organization-title", organization.name),
      accent,
    ]),
    h("span.organization-slug", `@${organization.slug}`),
    description,
  ]);
}

// ---- Join / leave ----

interface MembershipPanelProps {
  organization: OrganizationDetail;
  token: string | null;
  onChange(): void;
}

/** The four states of a visitor's standing, as one panel. */
function MembershipPanel({
  organization,
  token,
  onChange,
}: MembershipPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { role } = organization;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChange();
    } catch (caught) {
      let message = "Something went wrong. Please try again.";
      if (caught instanceof OrganizationAPIError) message = caught.message;
      setError(message);
    }
    setBusy(false);
  }

  let body = null;
  if (token == null) {
    body = h(Callout, { icon: "log-in" }, [
      h("span", "Sign in to ask to join this organization. "),
      h(AnchorButton, { href: "/login", small: true, minimal: true }, "Log in"),
    ]);
  } else if (role == null) {
    body = h("div.membership-row", [
      h(
        Button,
        {
          intent: "primary",
          icon: "new-person",
          loading: busy,
          onClick: () => run(() => requestMembership(organization.id, token)),
        },
        "Join"
      ),
      h(
        "span.membership-note",
        "An admin reviews your request before you join."
      ),
    ]);
  } else if (role === "requested") {
    body = h("div.membership-row", [
      h(Tag, { icon: "time", minimal: true, large: true }, "Request pending"),
      h(
        Button,
        {
          minimal: true,
          loading: busy,
          onClick: () => run(() => leaveOrganization(organization.id, token)),
        },
        "Withdraw request"
      ),
      h(
        "span.membership-note",
        "An admin of this organization has to approve you."
      ),
    ]);
  } else {
    let roleTag = h(
      Tag,
      { icon: "tick", intent: "success", large: true },
      "Member"
    );
    if (role === "admin") {
      roleTag = h(
        Tag,
        { icon: "shield", intent: "success", large: true },
        "Admin"
      );
    }
    body = h("div.membership-row", [
      roleTag,
      h(
        Button,
        {
          minimal: true,
          loading: busy,
          onClick: () => run(() => leaveOrganization(organization.id, token)),
        },
        "Leave"
      ),
    ]);
  }

  let callout = null;
  if (error != null) {
    callout = h(Callout, { intent: "danger", role: "alert" }, error);
  }

  return h("section.membership-panel", [body, callout]);
}

// ---- Facts ----

function OrganizationFacts({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  let visibility = h(Tag, { minimal: true }, "Private");
  if (organization.public) {
    visibility = h(Tag, { intent: "success", minimal: true }, "Public");
  }

  let website = null;
  const websiteURL = safeExternalURL(organization.url);
  if (websiteURL != null) {
    website = h(
      "a.organization-website",
      {
        href: websiteURL,
        target: "_blank",
        rel: "noopener noreferrer nofollow ugc",
        referrerPolicy: "no-referrer",
      },
      [new URL(websiteURL).hostname, h(Icon, { icon: "share", size: 12 })]
    );
  }

  // Guarded against an API that predates the summary fields: a missing number
  // drops its tile rather than printing "undefined".
  const facts = [];
  if (organization.member_count != null) {
    facts.push(
      h(Fact, {
        key: "members",
        label: "Members",
        value: String(organization.member_count),
      })
    );
  }
  if (organization.checkin_count != null) {
    facts.push(
      h(Fact, {
        key: "checkins",
        label: "Checkins",
        value: String(organization.checkin_count),
      })
    );
  }
  const formatted = formatDate(organization.last_checkin);
  if (formatted !== "") {
    facts.push(
      h(Fact, { key: "last", label: "Last checkin", value: formatted })
    );
  }

  // Members see the organization's own feed; everyone else sees whatever it
  // has made public, which is nothing at all for a members-only organization.
  let feedHref = `/dev/feed/orgs?org_id=${organization.id}`;

  return h("section.organization-facts", [
    h.if(facts.length > 0)("div.fact-row", facts),
    h("div.organization-meta", [visibility, website]),
    h(
      AnchorButton,
      { href: feedHref, icon: "feed", minimal: true },
      "See this organization's checkins"
    ),
  ]);
}

function Fact({ label, value }: { label: string; value: string }) {
  return h("div.fact", [
    h("span.fact-value", value),
    h("span.fact-label", label),
  ]);
}

// ---- Roster ----

interface RosterProps {
  organization: OrganizationDetail;
  members: OrganizationMember[];
  token: string | null;
  onChange(): void;
}

/** The people in the organization, with the pending requests above them when
 * the viewer is an admin — the API only returns those rows to an admin, so for
 * anyone else the section simply isn't there. */
function Roster({ organization, members, token, onChange }: RosterProps) {
  const isAdmin = organization.role === "admin";
  const pending = members.filter((m) => m.role === "requested");
  const joined = members.filter((m) => m.role !== "requested");

  let requests = null;
  if (isAdmin && pending.length > 0) {
    requests = h("section.roster-section", [
      h("h2.section-title", `Join requests (${pending.length})`),
      h(
        "ul.member-list",
        pending.map((member) =>
          h(JoinRequestRow, {
            key: member.person_id,
            member,
            organizationId: organization.id,
            token,
            onChange,
          })
        )
      ),
    ]);
  }

  let roster = h("p.muted", "No members yet.");
  if (joined.length > 0) {
    roster = h(
      "ul.member-list",
      joined.map((member) =>
        h("li.member-row", { key: member.person_id }, [
          h(Icon, { icon: "person", size: 14, "aria-hidden": true }),
          h("span.member-name", displayName(member)),
          h(Tag, { minimal: true }, member.role),
        ])
      )
    );
  }

  return h("div", [
    requests,
    h("section.roster-section", [
      h("h2.section-title", "Members"),
      roster,
      h.if(!isAdmin && organization.member_count > joined.length)(
        "p.muted",
        "Some members keep their Rockd profile private and aren't listed."
      ),
    ]),
  ]);
}

export interface JoinRequestRowProps {
  member: OrganizationMember;
  organizationId: number;
  token: string | null;
  /** Shown after the person's name, for a list that spans organizations (the
   * profile page). Left out on an organization's own page, where it would
   * repeat the heading. */
  organizationName?: string;
  onChange(): void;
}

/** One person waiting to be let into an organization. Approve writes the row
 * to `member`; Deny removes it. Denying is the destructive one, so it
 * confirms first. Shared by an organization's roster and the profile page's
 * cross-organization list. */
export function JoinRequestRow({
  member,
  organizationId,
  organizationName,
  token,
  onChange,
}: JoinRequestRowProps) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    if (token == null) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      setConfirming(false);
      onChange();
    } catch (caught) {
      let message = "That didn't work. Please try again.";
      if (caught instanceof OrganizationAPIError) message = caught.message;
      setError(message);
      setBusy(false);
    }
  }

  let target = null;
  if (organizationName != null) {
    target = h("span.member-target", [
      h(Icon, { icon: "arrow-right", size: 12, "aria-hidden": true }),
      organizationName,
    ]);
  }

  return h("li.member-row.request-row", [
    h(Icon, { icon: "new-person", size: 14, "aria-hidden": true }),
    h("span.member-name", displayName(member)),
    target,
    h("span.member-asked", `asked ${formatDate(member.date_added)}`),
    h("div.request-actions", [
      h(
        Button,
        {
          small: true,
          intent: "success",
          icon: "tick",
          loading: busy,
          onClick: () =>
            run(() =>
              setMemberRole(organizationId, member.person_id, "member", token!)
            ),
        },
        "Approve"
      ),
      h(
        Button,
        {
          small: true,
          minimal: true,
          icon: "cross",
          disabled: busy,
          onClick: () => setConfirming(true),
        },
        "Deny"
      ),
    ]),
    h.if(error != null)("span.field-error", error),
    h(
      Alert,
      {
        isOpen: confirming,
        intent: "danger",
        icon: "cross",
        confirmButtonText: "Deny request",
        cancelButtonText: "Cancel",
        loading: busy,
        onCancel: () => setConfirming(false),
        onConfirm: () =>
          run(() => removeMember(organizationId, member.person_id, token!)),
      },
      h(
        "p",
        `Deny ${displayName(
          member
        )}'s request to join? They can ask again later.`
      )
    ),
  ]);
}
