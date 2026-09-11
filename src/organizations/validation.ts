import type { CreateOrganizationInput } from "./types";

export interface OrganizationFormValues {
  name: string;
  slug: string;
  description: string;
  url: string;
  logoURL: string;
  color: string;
}

export type OrganizationFormErrors = Partial<
  Record<keyof OrganizationFormValues, string>
>;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

interface ExternalURLOptions {
  httpsOnly?: boolean;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Canonicalize an untrusted URL before using it in an href or image src. */
export function safeExternalURL(
  value: string | null | undefined,
  options: ExternalURLOptions = {}
): string | null {
  if (value == null || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    if (url.username !== "" || url.password !== "") return null;
    if (options.httpsOnly && url.protocol !== "https:") return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function safeOrganizationColor(
  value: string | null | undefined
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!COLOR_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function validateOrganization(
  values: OrganizationFormValues
): OrganizationFormErrors {
  const errors: OrganizationFormErrors = {};
  if (values.name.trim() === "") errors.name = "Enter an organization name.";
  if (!SLUG_PATTERN.test(values.slug)) {
    errors.slug =
      "Use lowercase letters and numbers separated by single hyphens.";
  }
  if (values.url !== "" && safeExternalURL(values.url) == null) {
    errors.url = "Enter a complete http or https URL.";
  }
  if (
    values.logoURL !== "" &&
    safeExternalURL(values.logoURL, { httpsOnly: true }) == null
  ) {
    errors.logoURL = "Enter a complete https URL.";
  }
  if (values.color !== "" && !COLOR_PATTERN.test(values.color)) {
    errors.color = "Enter a six-digit hex color, such as #C5050C.";
  }
  return errors;
}

function optional(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  return trimmed;
}

export function createInputFromValues(
  values: OrganizationFormValues
): CreateOrganizationInput {
  return {
    name: values.name.trim(),
    slug: values.slug,
    description: optional(values.description),
    url: safeExternalURL(values.url),
    logo_url: safeExternalURL(values.logoURL, { httpsOnly: true }),
    color: safeOrganizationColor(values.color),
  };
}
