export type OrganizationRole = "requested" | "invited" | "member" | "admin";

export interface Organization {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  url: string | null;
  logo_url: string | null;
  color: string | null;
  /** Whether eligible checkins may be public, not whether the org is listed. */
  public: boolean;
  created: string;
  updated: string;
}

export interface OrganizationSummary extends Organization {
  member_count: number;
}

export interface OrganizationDetail extends Organization {
  role: OrganizationRole | null;
}

export interface OrganizationMembership extends OrganizationSummary {
  role: OrganizationRole;
  date_added: string;
}

export interface CreateOrganizationInput {
  slug: string;
  name: string;
  description?: string | null;
  url?: string | null;
  logo_url?: string | null;
  color?: string | null;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string | null;
  url?: string | null;
  logo_url?: string | null;
  color?: string | null;
  public?: boolean;
}
