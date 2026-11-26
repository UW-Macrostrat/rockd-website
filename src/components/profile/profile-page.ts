/**
 * `/profile` — the signed-in person's account, read-only, and the one place
 * that shows every organization join request waiting on them.
 *
 * Read-only on purpose: everything here comes from the login payload the site
 * already holds and from the organization routes. Editing a Rockd account
 * (name, email, password, profile visibility) goes through
 * `/protected/profile/*`, which this page deliberately does not touch yet.
 */
import {
  AnchorButton,
  Callout,
  Card,
  Icon,
  NonIdealState,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { useStoredRockdAuth, type RockdLoginPayload } from "~/components/auth";
import { JoinRequestRow } from "~/components/organizations";
import {
  useMyMemberships,
  type OrganizationMembership,
  type PendingRequest,
} from "~/organizations";
import styles from "./profile.module.sass";

const h = hyper.styled(styles);

function formatDate(value: string | null | undefined): string {
  if (value == null) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function displayName(auth: RockdLoginPayload): string {
  const { first_name, last_name } = auth.person ?? {};
  const name = [first_name, last_name].filter(Boolean).join(" ").trim();
  if (name !== "") return name;
  return "Your account";
}

export function ProfilePage() {
  const { checked, auth } = useStoredRockdAuth();
  const token = auth?.token ?? auth?.person?.token ?? null;
  const [refreshKey, setRefreshKey] = useState(0);
  const { memberships, requests, error, loading } = useMyMemberships(
    token,
    refreshKey
  );

  if (!checked) {
    return h("main.profile-main", [
      h("div.profile-state", { role: "status" }, [
        h(Spinner),
        h("span", "Checking your sign-in…"),
      ]),
    ]);
  }

  if (auth == null) {
    return h(
      "main.profile-main",
      h(NonIdealState, {
        icon: "user",
        title: "Not signed in",
        description: "Sign in to see your account and your organizations.",
        action: h(
          AnchorButton,
          { href: "/login", intent: "primary", icon: "log-in" },
          "Log in"
        ),
      })
    );
  }

  return h("main.profile-main", [
    h(AccountSummary, { auth }),
    h(JoinRequests, {
      requests,
      token,
      loading,
      error,
      onChange: () => setRefreshKey(refreshKey + 1),
    }),
    h(Memberships, { memberships, loading }),
  ]);
}

// ---- Account ----

function AccountSummary({ auth }: { auth: RockdLoginPayload }) {
  const person = auth.person ?? ({} as RockdLoginPayload["person"]);

  let visibility = h(Tag, { minimal: true, icon: "lock" }, "Private profile");
  if (person.public) {
    visibility = h(
      Tag,
      { minimal: true, intent: "success", icon: "globe" },
      "Public profile"
    );
  }

  const facts: { label: string; value: string }[] = [];
  if (person.email) facts.push({ label: "Email", value: person.email });
  if (person.affiliation) {
    facts.push({ label: "Affiliation", value: person.affiliation });
  }
  if (person.orc_id) facts.push({ label: "ORCID", value: person.orc_id });
  const joined = formatDate(person.created);
  if (joined !== "") facts.push({ label: "Member since", value: joined });

  return h("header.profile-header", [
    h("div.profile-identity", [
      h(Icon, { icon: "user", size: 28, "aria-hidden": true }),
      h("div", [
        h("h1.profile-name", displayName(auth)),
        h("span.profile-id", `Person ${person.person_id}`),
      ]),
      visibility,
    ]),
    h(
      "dl.profile-facts",
      facts.flatMap(({ label, value }) => [
        h("dt", { key: `${label}-label` }, label),
        h("dd", { key: `${label}-value` }, value),
      ])
    ),
  ]);
}

// ---- Join requests ----

interface JoinRequestsProps {
  requests: PendingRequest[];
  token: string | null;
  loading: boolean;
  error: Error | null;
  onChange(): void;
}

/** Everyone waiting on this person, across every organization they
 * administer. Absent entirely when there is nothing to act on — a heading
 * reading "0 requests" is noise on an account page. */
function JoinRequests({
  requests,
  token,
  loading,
  error,
  onChange,
}: JoinRequestsProps) {
  if (loading) {
    return h("section.profile-section", [
      h("h2.section-title", "Join requests"),
      h("div.profile-state", { role: "status" }, [
        h(Spinner, { size: 20 }),
        h("span", "Checking your organizations…"),
      ]),
    ]);
  }

  if (error != null) {
    return h("section.profile-section", [
      h("h2.section-title", "Join requests"),
      h(
        Callout,
        { intent: "warning", role: "alert" },
        "Your organizations couldn't be loaded, so any pending requests aren't shown."
      ),
    ]);
  }

  if (requests.length === 0) return null;

  return h("section.profile-section", [
    h("h2.section-title", [
      "Join requests ",
      h(Tag, { intent: "primary", round: true }, String(requests.length)),
    ]),
    h(
      "p.section-note",
      "People who have asked to join an organization you administer."
    ),
    h(
      "ul.member-list",
      requests.map(({ organization, member }) =>
        h(JoinRequestRow, {
          key: `${organization.id}-${member.person_id}`,
          member,
          organizationId: organization.id,
          organizationName: organization.name,
          token,
          onChange,
        })
      )
    ),
  ]);
}

// ---- Organizations ----

function Memberships({
  memberships,
  loading,
}: {
  memberships: OrganizationMembership[];
  loading: boolean;
}) {
  if (loading) return null;

  let body = h(
    "p.muted",
    "You haven't joined an organization yet."
  );
  if (memberships.length > 0) {
    body = h(
      "div.membership-grid",
      memberships.map((organization) =>
        h(MembershipCard, { key: organization.id, organization })
      )
    );
  }

  return h("section.profile-section", [
    h("h2.section-title", "Your organizations"),
    body,
    h(
      AnchorButton,
      { href: "/orgs", icon: "search", minimal: true },
      "Browse organizations"
    ),
  ]);
}

function MembershipCard({
  organization,
}: {
  organization: OrganizationMembership;
}) {
  let roleTag = h(Tag, { minimal: true }, organization.role);
  if (organization.role === "admin") {
    roleTag = h(Tag, { intent: "success", minimal: true }, "admin");
  } else if (organization.role === "requested") {
    roleTag = h(Tag, { icon: "time", minimal: true }, "awaiting approval");
  }

  return h(Card, { className: "membership-card" }, [
    h("a.membership-link", { href: `/orgs/${organization.id}` }, [
      h("span.membership-name", organization.name),
      h("span.membership-slug", `@${organization.slug}`),
    ]),
    roleTag,
  ]);
}
