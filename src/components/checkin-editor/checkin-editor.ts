/**
 * The checkin editor: the app's create/edit page as a web page. Loads the
 * checkin (or starts a blank one), holds the draft in its own jotai store,
 * keeps unsaved edits in `localStorage`, and saves through the two-phase
 * sync (`~/checkin-editor/sync`).
 *
 * Needs a signed-in user; a checkin that isn't theirs is shown read-only
 * elsewhere (`/checkin/:id`) rather than edited here.
 */
import {
  AnchorButton,
  Button,
  Callout,
  NonIdealState,
  Spinner,
} from "@blueprintjs/core";
import { MacrostratDataProvider } from "@macrostrat/data-provider";
import hyper from "@macrostrat/hyper";
import {
  createStore,
  Provider,
  useAtomValue,
  useSetAtom,
  useStore,
} from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "vike/client/router";
import { useRockdAuth } from "~/components/auth";
import {
  clearDraft,
  draftAtom,
  draftFromAPI,
  draftKey,
  fetchCheckin,
  isDirtyAtom,
  loadDraft,
  localPhotosByName,
  MACROSTRAT_API,
  newCheckin,
  originalAtom,
  resetDraftAtom,
  saveDraft,
  saveStateAtom,
  syncCheckin,
  uploadPhotoSlots,
  type CheckinDraft,
  type LocalPhoto,
  type StoredDraft,
  type SyncProgress,
} from "~/checkin-editor";
import { CheckinFields } from "./checkin-fields";
import { ObservationList } from "./observation-editor";
import { SavePanel } from "./save-panel";
import styles from "./checkin-editor.module.sass";

const h = hyper.styled(styles);

export interface CheckinEditorProps {
  /** The checkin to edit; null starts a new one */
  checkinId: number | null;
  /** For a new checkin: a stored draft to pick up (`?draft=` on the page) */
  draftKey?: string | null;
}

export function CheckinEditor({
  checkinId,
  draftKey: storedKey = null,
}: CheckinEditorProps) {
  const auth = useRockdAuth();
  // One store per editor, so two editors never share a draft
  const store = useMemo(() => createStore(), []);

  if (!auth.checked) return h(Spinner, { className: "editor-spinner" });

  if (auth.token == null || auth.personId == null) {
    return h(NonIdealState, {
      icon: "log-in",
      title: "Sign in to edit checkins",
      description: "Checkins are saved to your Rockd account.",
      action: h(
        AnchorButton,
        { href: "/login", intent: "primary", icon: "log-in" },
        "Log in"
      ),
    });
  }

  return h(
    Provider,
    { store },
    h(
      MacrostratDataProvider,
      { baseURL: MACROSTRAT_API },
      h(EditorBody, {
        checkinId,
        storedKey,
        personId: auth.personId,
        token: auth.token,
      })
    )
  );
}

interface EditorBodyProps {
  checkinId: number | null;
  storedKey: string | null;
  personId: number;
  token: string;
}

function EditorBody({
  checkinId,
  storedKey,
  personId,
  token,
}: EditorBodyProps) {
  const load = useDraftLoader({ checkinId, storedKey, personId, token });
  const { save, retryPhotos } = useSaveCheckin({ personId, token });
  useAutosaveDraft();
  useUnloadWarning();

  if (load.status === "loading")
    return h(Spinner, { className: "editor-spinner" });

  if (load.status === "missing") {
    return h(NonIdealState, {
      icon: "search",
      title: "Checkin not found",
      description: "It may have been deleted.",
      action: h(
        AnchorButton,
        { href: "/dev/feed/mine", minimal: true },
        "Your checkins"
      ),
    });
  }

  if (load.status === "forbidden") {
    return h(NonIdealState, {
      icon: "lock",
      title: "Not your checkin",
      description: "Only the person who recorded a checkin can edit it.",
      action: h(
        AnchorButton,
        { href: `/checkin/${checkinId}`, minimal: true },
        "View it instead"
      ),
    });
  }

  if (load.status === "error") {
    return h(NonIdealState, {
      icon: "error",
      title: "Couldn't load the checkin",
      description: load.error?.message,
      action: h(
        Button,
        { onClick: () => window.location.reload() },
        "Try again"
      ),
    });
  }

  function onDeleted() {
    const draft = load.current();
    if (draft != null) clearDraft(draftKey(draft));
    navigate("/dev/feed/mine");
  }

  return h("div.checkin-editor", [
    h(RestorePrompt, { stored: load.restorable, onDone: load.dismissRestore }),
    h("div.editor-columns", [
      h("div.editor-main", [h(CheckinFields, { token }), h(ObservationList)]),
      h(
        "aside.editor-side",
        h(SavePanel, {
          token,
          onSave: save,
          onRetryPhotos: retryPhotos,
          onDeleted,
        })
      ),
    ]),
  ]);
}

// ---- Loading ----

type LoadStatus = "loading" | "ready" | "missing" | "forbidden" | "error";

interface LoaderState {
  status: LoadStatus;
  error?: Error;
  /** Unsaved edits found in storage for this checkin, awaiting a decision */
  restorable: StoredDraft | null;
  dismissRestore: () => void;
  current: () => CheckinDraft | null;
}

function useDraftLoader({
  checkinId,
  storedKey,
  personId,
  token,
}: EditorBodyProps): LoaderState {
  const store = useStore();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<Error | undefined>();
  const [restorable, setRestorable] = useState<StoredDraft | null>(null);

  useEffect(() => {
    let live = true;
    setStatus("loading");

    // A new checkin, possibly picking up a stored draft
    if (checkinId == null) {
      const blank = newCheckin(personId);
      const stored = storedKey != null ? loadDraft(storedKey) : null;
      if (stored != null) {
        const original = {
          ...blank,
          new_checkin_id: stored.draft.new_checkin_id,
        };
        store.set(originalAtom, original);
        store.set(draftAtom, { ...stored.draft, person_id: personId });
      } else {
        store.set(resetDraftAtom, blank);
      }
      setStatus("ready");
      return;
    }

    const controller = new AbortController();
    fetchCheckin(checkinId, token, controller.signal).then(
      (checkin) => {
        if (!live) return;
        if (checkin == null) return setStatus("missing");
        if (Number(checkin.person_id) !== personId)
          return setStatus("forbidden");
        store.set(resetDraftAtom, draftFromAPI(checkin));
        setRestorable(loadDraft(String(checkinId)));
        setStatus("ready");
      },
      (err) => {
        if (!live || err?.name === "AbortError") return;
        setError(err);
        setStatus("error");
      }
    );
    return () => {
      live = false;
      controller.abort();
    };
  }, [checkinId, storedKey, personId, token]);

  return {
    status,
    error,
    restorable,
    dismissRestore: () => setRestorable(null),
    current: () => store.get(draftAtom),
  };
}

/** Unsaved edits were found for this checkin: pick them up, or forget them. */
function RestorePrompt({
  stored,
  onDone,
}: {
  stored: StoredDraft | null;
  onDone: () => void;
}) {
  const store = useStore();
  if (stored == null) return null;

  function restore() {
    const current = store.get(draftAtom);
    // Keep the server's baseline; the restored edits are the unsaved part
    store.set(draftAtom, {
      ...stored!.draft,
      person_id: current?.person_id ?? null,
    });
    onDone();
  }

  function discard() {
    const current = store.get(draftAtom);
    if (current != null) clearDraft(draftKey(current));
    onDone();
  }

  let photos = null;
  if (stored.droppedPhotos > 0) {
    photos = ` ${stored.droppedPhotos} chosen photo${
      stored.droppedPhotos === 1 ? "" : "s"
    } couldn't be kept.`;
  }

  return h(
    Callout,
    {
      intent: "primary",
      icon: "history",
      compact: true,
      className: "restore-callout",
    },
    [
      h(
        "span",
        `You have unsaved edits to this checkin from ${new Date(
          stored.savedAt
        ).toLocaleString()}.${photos ?? ""}`
      ),
      h("div.exif-actions", [
        h(
          Button,
          { small: true, intent: "primary", onClick: restore },
          "Restore them"
        ),
        h(Button, { small: true, minimal: true, onClick: discard }, "Discard"),
      ]),
    ]
  );
}

// ---- Saving ----

function useSaveCheckin({
  personId,
  token,
}: {
  personId: number;
  token: string;
}) {
  const store = useStore();
  // Files of the photos a save asked for, kept so a failed upload can be retried
  const pending = useRef<Map<string, LocalPhoto>>(new Map());

  const onProgress = (progress: SyncProgress) =>
    store.set(saveStateAtom, (s) => ({ ...s, progress }));

  async function reloadFromServer(checkinId: number) {
    const fresh = await fetchCheckin(checkinId, token);
    if (fresh != null) store.set(resetDraftAtom, draftFromAPI(fresh));
  }

  async function save() {
    const draft = store.get(draftAtom);
    if (draft == null) return;
    const wasNew = draft.checkin_id == null;
    store.set(saveStateAtom, {
      progress: { phase: "metadata", photosDone: 0, photosTotal: 0 },
      error: null,
      failedPhotos: [],
      xp: null,
    });
    pending.current = localPhotosByName(draft);

    const result = await syncCheckin(draft, { personId, token, onProgress });
    if (result.status === "cancelled") return;
    if (result.status === "metadata_failed" || result.checkinId == null) {
      store.set(saveStateAtom, (s) => ({ ...s, error: result.error ?? null }));
      return;
    }

    // The checkin is on the server; the stored draft has done its job
    clearDraft(draftKey(draft));
    store.set(saveStateAtom, (s) => ({
      ...s,
      xp: result.xp ?? null,
      error: result.error ?? null,
      failedPhotos: result.failedPhotos ?? [],
    }));

    // The server's ids replace the client's, so saving again updates rather
    // than re-creates. A new checkin's URL becomes its edit page in place,
    // keeping this component (and the files a photo retry needs) mounted.
    if (wasNew && typeof window !== "undefined") {
      window.history.replaceState(null, "", `/dev/checkin/${result.checkinId}`);
    }
    await reloadFromServer(result.checkinId);
    if (result.status === "success") {
      store.set(saveStateAtom, (s) => ({
        ...s,
        progress: { phase: "done", photosDone: 0, photosTotal: 0 },
      }));
    }
  }

  async function retryPhotos() {
    const { failedPhotos } = store.get(saveStateAtom);
    const draft = store.get(draftAtom);
    if (failedPhotos.length === 0 || draft?.checkin_id == null) return;
    store.set(saveStateAtom, (s) => ({ ...s, error: null }));
    const outcome = await uploadPhotoSlots(failedPhotos, pending.current, {
      token,
      onProgress,
    });
    if (outcome.cancelled) return;
    let error: Error | null = null;
    let phase: SyncProgress["phase"] = "done";
    if (outcome.failed.length > 0) {
      phase = "failed";
      error = new Error(
        `${outcome.failed.length} photo(s) still didn't upload.`
      );
    }
    store.set(saveStateAtom, (s) => ({
      ...s,
      error,
      failedPhotos: outcome.failed,
      progress: {
        phase,
        photosDone: outcome.done.size,
        photosTotal: failedPhotos.length,
      },
    }));
    await reloadFromServer(draft.checkin_id);
  }

  return { save, retryPhotos };
}

// ---- Keeping edits ----

/** Writes the draft to `localStorage` while it differs from the baseline, and
 * forgets it once it doesn't (saved, or changes discarded). */
function useAutosaveDraft() {
  const draft = useAtomValue(draftAtom);
  const dirty = useAtomValue(isDirtyAtom);
  useEffect(() => {
    if (draft == null) return;
    const key = draftKey(draft);
    const timer = setTimeout(() => {
      if (dirty) saveDraft(key, draft);
      else clearDraft(key);
    }, 600);
    return () => clearTimeout(timer);
  }, [draft, dirty]);
}

function useUnloadWarning() {
  const dirty = useAtomValue(isDirtyAtom);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}
