import { AnchorButton, NonIdealState, Spinner } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { useEffect, useState, type ReactNode } from "react";
import { Footer, RockdSiteIcon } from "~/components";
import { OrganizationForm } from "~/components/organizations";
import {
  createOrganization,
  OrganizationAPIError,
  type CreateOrganizationInput,
} from "~/organizations";
import { getStoredRockdToken } from "../../login/rockd-auth";
import styles from "~/components/organizations/organizations.module.sass";

const h = hyper.styled(styles);

interface AuthState {
  checked: boolean;
  token: string | null;
}

export function Page() {
  const [auth, setAuth] = useState<AuthState>({ checked: false, token: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setAuth({ checked: true, token: getStoredRockdToken() });
  }, []);

  async function submit(input: CreateOrganizationInput) {
    if (auth.token == null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const organization = await createOrganization(input, auth.token);
      const created = encodeURIComponent(organization.name);
      window.location.assign(`/organizations?created=${created}`);
    } catch (error) {
      let message = "Something went wrong while creating the organization.";
      if (error instanceof OrganizationAPIError) message = error.message;
      setSubmitError(message);
      setSubmitting(false);
    }
  }

  let body: ReactNode = h("div.directory-state", { role: "status" }, [
    h(Spinner),
    h("span", "Checking your sign-in…"),
  ]);

  if (auth.checked && auth.token == null) {
    body = h(NonIdealState, {
      icon: "log-in",
      title: "Sign in to create an organization",
      description:
        "Organization pages are public, but creating one requires a Rockd account.",
      action: h(
        AnchorButton,
        { href: "/login", intent: "primary", icon: "log-in" },
        "Log in"
      ),
    });
  } else if (auth.token != null) {
    body = h("div", [
      h("a.breadcrumb", { href: "/organizations" }, "← All organizations"),
      h("div.create-heading", [
        h("h1", "Create an organization"),
        h(
          "p",
          "Set up a group for people who will share geological checkins in Rockd. You will become its first administrator."
        ),
      ]),
      h(OrganizationForm, { onSubmit: submit, submitting, submitError }),
    ]);
  }

  return h("div.create-page", [
    h("header.organizations-header", [
      h(RockdSiteIcon, { className: "site-icon" }),
      h("div.header-title", h("h1", "Organizations")),
    ]),
    h("main.create-main", body),
    h(Footer),
  ]);
}
