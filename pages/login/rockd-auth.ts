const ROCKD_AUTH_STORAGE_KEY = "rockd-auth";

export interface RockdLoginPayload {
  token: string;
  expires: number;
  person: {
    person_id: number;
    first_name: string;
    last_name: string;
    email: string;
    public: boolean;
    save_photos: boolean;
    autocorrect: boolean;
    oauth_type: string;
    created: string;
    affiliation: string;
    orc_id: string;
    token: string;
    expires: number;
  };
}

export function saveRockdAuth(payload: RockdLoginPayload) {
  localStorage.setItem(ROCKD_AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function getStoredRockdAuth(): RockdLoginPayload | null {
  const raw = localStorage.getItem(ROCKD_AUTH_STORAGE_KEY);
  if (raw == null) return null;

  try {
    return JSON.parse(raw) as RockdLoginPayload;
  } catch {
    return null;
  }
}

export function clearRockdAuth() {
  localStorage.removeItem(ROCKD_AUTH_STORAGE_KEY);
}

export function getStoredRockdPersonId(): number | null {
  const auth = getStoredRockdAuth();
  return auth?.person?.person_id ?? null;
}
