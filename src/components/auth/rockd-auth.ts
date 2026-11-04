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
  refreshRockdAuth();
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
  refreshRockdAuth();
}

export function getStoredRockdPersonId(): number | null {
  const auth = getStoredRockdAuth();
  return auth?.person?.person_id ?? null;
}

export function getStoredRockdToken(): string | null {
  const auth = getStoredRockdAuth();
  return auth?.token ?? auth?.person?.token ?? null;
}

/** The stored login, read after mount (`localStorage` isn't there during a
 * server render): `checked` turns true once it's been read. */
export function useStoredRockdAuth(): {
  checked: boolean;
  auth: RockdLoginPayload | null;
} {
  const [state, setState] = useState<{
    checked: boolean;
    auth: RockdLoginPayload | null;
  }>({ checked: false, auth: null });

  useEffect(() => {
    setState({ checked: true, auth: getStoredRockdAuth() });
  }, []);

  return state;
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

// ---- Shared sign-in state ----
// One atom in jotai's default store, hydrated from `localStorage` by whichever
// component reads it first, so the header, the feed's cards and the editor
// all agree on who is signed in without each reading storage. It lives in the
// default store on purpose: an editor's own jotai `Provider` must not scope it.

import { atom, getDefaultStore, useAtomValue } from "jotai";

export interface RockdAuthState {
  checked: boolean;
  auth: RockdLoginPayload | null;
  personId: number | null;
  token: string | null;
}

const authAtom = atom<RockdAuthState>({
  checked: false,
  auth: null,
  personId: null,
  token: null,
});

function readAuthState(): RockdAuthState {
  const auth = getStoredRockdAuth();
  return {
    checked: true,
    auth,
    personId: auth?.person?.person_id ?? null,
    token: auth?.token ?? auth?.person?.token ?? null,
  };
}

/** Re-reads the stored login (after a login, logout, or a change in another
 * tab) into the shared state. */
export function refreshRockdAuth() {
  getDefaultStore().set(authAtom, readAuthState());
}

let listening = false;

export function useRockdAuth(): RockdAuthState {
  const state = useAtomValue(authAtom, { store: getDefaultStore() });

  useEffect(() => {
    if (!state.checked) refreshRockdAuth();
    if (listening) return;
    listening = true;
    window.addEventListener("storage", (event) => {
      if (event.key === ROCKD_AUTH_STORAGE_KEY || event.key == null) {
        refreshRockdAuth();
      }
    });
  }, [state.checked]);

  return state;
}
