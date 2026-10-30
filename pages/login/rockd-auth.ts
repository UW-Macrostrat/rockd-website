import { useEffect, useState } from "react";

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

export function getStoredRockdToken(): string | null {
  const auth = getStoredRockdAuth();
  return auth?.token ?? auth?.person?.token ?? null;
}

/** The signed-in user's person id, for a page behind a sign-in: null until
 * it's read, and a signed-out visitor is sent to /login. */
export function useRequiredRockdPersonId(): number | null {
  const [personId, setPersonId] = useState<number | null>(null);

  useEffect(() => {
    const storedId = getStoredRockdPersonId();
    if (storedId == null) {
      window.location.href = "/login";
      return;
    }
    setPersonId(storedId);
  }, []);

  return personId;
}
