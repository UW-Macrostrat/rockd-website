/** There is no invitation flow: someone asks to join ("requested") and an
 * admin approves them into "member". Ordered as the database enum is, because
 * the API compares roles with `>= 'member'` to mean "actually in the org". */
export type OrganizationRole = "requested" | "member" | "admin";

/** Someone on an organization's roster. A "requested" row is only visible to
 * that organization's admins. */
export interface OrganizationMember {
  person_id: number;
  first_name: string | null;
  last_name: string | null;
  role: OrganizationRole;
  date_added: string;
}

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
  /** How many checkins have been shared with the org. Counts everything
   * shared, members-only rows included — a total gives nothing away about who
   * posted what, so it is the same number for every visitor. */
  checkin_count: number;
  /** When the most recent checkin was shared, or null if none has been. */
  last_checkin: string | null;
}

/** One organization's page: the directory's summary numbers plus the caller's
 * own standing in it, which is null when they have no row at all. */
export interface OrganizationDetail extends OrganizationSummary {
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
  /** Whether eligible checkins may be public. Omitted or false creates a
   * members-only organization, which is the API's default. */
  public?: boolean;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string | null;
  url?: string | null;
  logo_url?: string | null;
  color?: string | null;
  public?: boolean;
}
