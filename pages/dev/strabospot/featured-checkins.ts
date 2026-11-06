import {
  AnchorButton,
  Button,
  Callout,
  Card,
  Dialog,
  DialogBody,
  DialogFooter,
} from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import hyper from "@macrostrat/hyper";
import { createContext, useContext, useState } from "react";
import {
  type Checkin,
  createMapCheckinCard,
  MapCheckinCardBody,
  MapCheckinFeed,
} from "~/components/checkin-feed";
import {
  editedSinceSync,
  getStoredPhotoFailures,
  getStoredSyncedAt,
  getStrabospotDatasetId,
  type PhotoFailures,
  resyncStrabospotPhotos,
  ROCKD_GREEN,
  saveStoredPhotoFailures,
  saveStoredSyncedAt,
  sendCheckinsToStrabospotDataset,
  STRABOSPOT_LOGO_URL,
} from "./strabospot-integration";
import { getStoredRockdToken } from "~/components/auth";
// The API module alone, not the editor's whole barrel (EXIF, drafts, sync)
import { fetchCheckin } from "~/checkin-editor/api";
import dialogStyles from "./send-results-dialog.module.sass";

// The results dialog's own classes
const s = hyper.styled(dialogStyles);

// The list fills the sidebar, with the selection controls under it
const listLayoutStyle = {
  display: "flex",
  flexDirection: "column" as const,
  flex: "1 1 auto",
  minHeight: 0,
};

// A selected card's outline, in the Rockd icon's greens: its darker outline
// green, so a thin line still shows on a white card, with a sage glow inside
const selectedOverlayStyle = {
  position: "absolute" as const,
  inset: 0,
  border: `2px solid ${ROCKD_GREEN.dark}`,
  borderRadius: "10px",
  boxShadow: "inset 0 0 0 2px rgba(147, 179, 152, 0.3)",
  pointerEvents: "none" as const,
};

// Sent: the Rockd icon's green, as the Linked button
const sentBadgeStyle = {
  flex: "0 0 auto",
  width: "18px",
  height: "18px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: `linear-gradient(180deg, ${ROCKD_GREEN.light} 0%, ${ROCKD_GREEN.base} 100%)`,
  border: `1px solid ${ROCKD_GREEN.dark}`,
  boxShadow:
    "inset 0 2px 4px rgba(16,53,29,0.2), inset 0 -1px 0 rgba(255,255,255,0.35), 0 1px 4px rgba(0,0,0,0.2)",
};

const sentBadgeCheckStyle = {
  color: ROCKD_GREEN.ink,
  fontSize: "11px",
  fontWeight: 700,
  lineHeight: 1,
};

const selectionFooterStyle = {
  flex: "0 0 auto",
  background: "var(--panel-background-color, white)",
  paddingTop: "0.75rem",
  paddingBottom: "0.5rem",
  borderTop: "1px solid var(--panel-rule-color, #ddd)",
  marginTop: "0.5rem",
};

const photoFailedBadgeStyle = {
  ...sentBadgeStyle,
  background: "linear-gradient(180deg, #fbbf4d 0%, #e08a12 100%)",
  border: "1px solid #b86e0b",
};

const photoFailedBadgeMarkStyle = {
  ...sentBadgeCheckStyle,
  color: "#5c3605",
};

// A card's "photos didn't sync" row, under its Details link
const photoFailedRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.5em",
  marginTop: "0.4em",
  padding: "0.35em 0.6em",
  borderRadius: "6px",
  background: "rgba(245, 158, 11, 0.12)",
  border: "1px solid rgba(245, 158, 11, 0.35)",
  fontSize: "12px",
};

/** What each card needs to know about the selection, from the list around it */
interface StrabospotSelection {
  isSynced: boolean;
  selectionMode: boolean;
  selected: Map<number, Checkin>;
  sentIds: Set<number>;
  /** Sent checkins some of whose photos didn't reach StraboSpot */
  photoFailures: PhotoFailures;
  /** Checkins whose failed photos are being resynced */
  resyncingIds: Set<number>;
  toggle(checkin: Checkin): void;
  /** Uploads only the photos of these checkins that didn't make it */
  resyncPhotos(checkinIds: number[]): void;
  /** Each synced checkin's `updated` just after its sync, by id */
  syncedAt: Record<string, string>;
  /** Sends edited checkins again */
  resyncEdited(checkinIds: number[]): void;
}

const SelectionContext = createContext<StrabospotSelection | null>(null);

function useSelection(): StrabospotSelection {
  const selection = useContext(SelectionContext);
  if (selection == null) throw new Error("Missing StraboSpot selection");
  return selection;
}

/** A checkin counts as sent once the Rockd DB has its `spot_id`, or once it
 * was sent during this session (so the badge appears without a refetch). */
function isSent(checkin: Checkin, sentIds: Set<number>): boolean {
  return checkin.spot_id != null || sentIds.has(checkin.checkin_id);
}

/**
 * The StraboSpot page's list: the signed-in user's checkins in the shared
 * sidebar feed (search, infinite scroll), with a selection mode for sending
 * them to StraboSpot once the account is linked. A sent checkin can be
 * selected and sent again to carry an edit: StraboSpot updates the spot (same
 * checkin_id and spot_id) and its photos in place. Photos that failed are
 * remembered by id and resynced on their own, without resending the rest.
 */
export function FeatureDetails({ isStrabospotSynced, personId }) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Map<number, Checkin>>(new Map());
  const [localSentIds, setLocalSentIds] = useState<Set<number>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastSentCount, setLastSentCount] = useState<number | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastImageFailedIds, setLastImageFailedIds] = useState<number[]>([]);
  const [lastFailedCheckins, setLastFailedCheckins] = useState<
    Array<{ checkinId: number; message: string }>
  >([]);
  // The photos that didn't make it, by checkin; kept across reloads, so the
  // page can still offer to resync them
  const [photoFailures, setPhotoFailures] = useState<PhotoFailures>(() =>
    getStoredPhotoFailures()
  );
  const [resyncingIds, setResyncingIds] = useState<Set<number>>(new Set());
  // Each synced checkin's `updated` just after its sync, to spot later edits
  const [syncedAt, setSyncedAt] = useState<Record<string, string>>(() =>
    getStoredSyncedAt()
  );

  function updatePhotoFailures(change: (next: PhotoFailures) => void) {
    setPhotoFailures((prev) => {
      const next = new Map(prev);
      change(next);
      saveStoredPhotoFailures(next);
      return next;
    });
  }

  if (personId == null) {
    return null;
  }

  /** Sends checkins to StraboSpot (new or again), then records which went
   * through, which lost photos on the way, and which didn't go at all. */
  async function send(checkins: Checkin[]) {
    const rockdToken = getStoredRockdToken();
    if (!rockdToken) {
      throw new Error("Not logged in to Rockd. Please log in and try again.");
    }

    // Sends to StraboSpot and persists spot_id to the Rockd DB in one step.
    const response = await sendCheckinsToStrabospotDataset(
      checkins,
      rockdToken
    );

    const sentIds: number[] = (response?.sentCheckinIds ?? []).map(Number);
    const imageFailedIds: number[] = (
      response?.imageFailedCheckinIds ?? []
    ).map(Number);
    const failedCheckins = response?.failedCheckins ?? [];
    if (sentIds.length === 0 && failedCheckins.length > 0) {
      throw new Error(
        failedCheckins
          .map((f) => `Checkin ${f.checkinId}: ${f.message}`)
          .join("\n")
      );
    }
    setLastSentCount(sentIds.length);
    setLastImageFailedIds(imageFailedIds);
    setLastFailedCheckins(failedCheckins);

    setLocalSentIds((prev) => {
      const next = new Set(prev);
      for (const id of sentIds) next.add(id);
      return next;
    });

    // A checkin sent cleanly clears its old photo failure; one whose photos
    // failed (again) records exactly which (null: all of them)
    // An api-v3 without per-photo results names only the checkins; record
    // those as "all photos still to go"
    let imageFailures = response?.imageFailures;
    if (!Array.isArray(imageFailures)) {
      imageFailures = imageFailedIds.map((checkinId) => ({
        checkinId,
        photoIds: null,
      }));
    }
    updatePhotoFailures((next) => {
      for (const id of sentIds) next.delete(id);
      for (const failure of imageFailures) {
        let photoIds: number[] | null = null;
        if (Array.isArray(failure.photoIds)) {
          photoIds = failure.photoIds.map(Number);
        }
        next.set(Number(failure.checkinId), photoIds);
      }
    });

    setShowSuccessDialog(true);
    await recordSyncTimes(sentIds, rockdToken);
  }

  /** Records each sent checkin's `updated` as Rockd now reports it (the sync
   * just set it), so a later edit shows as needing a resync */
  async function recordSyncTimes(checkinIds: number[], rockdToken: string) {
    const fresh = await Promise.all(
      checkinIds.map((id) => fetchCheckin(id, rockdToken).catch(() => null))
    );
    setSyncedAt((prev) => {
      const next = { ...prev };
      for (const checkin of fresh) {
        if (checkin?.updated != null) {
          next[String(checkin.checkin_id)] = checkin.updated;
        }
      }
      saveStoredSyncedAt(next);
      return next;
    });
  }

  /** Sends edited checkins again, read fresh from Rockd so the edit goes */
  async function resyncEdited(checkinIds: number[]) {
    setSendError(null);
    setResyncingIds((prev) => new Set([...prev, ...checkinIds]));
    try {
      const token = getStoredRockdToken();
      const fresh = await Promise.all(
        checkinIds.map((id) => fetchCheckin(id, token))
      );
      await send(fresh.filter((c): c is Checkin => c != null));
    } catch (err: any) {
      setSendError(err?.message ?? "Failed to resync the checkin.");
    } finally {
      setResyncingIds((prev) => {
        const next = new Set(prev);
        for (const id of checkinIds) next.delete(id);
        return next;
      });
    }
  }

  /** Uploads only the photos of these checkins that didn't reach StraboSpot,
   * leaving their spots and the photos already there alone. A photo that
   * fails again stays recorded for the next try. */
  async function resyncPhotos(checkinIds: number[]) {
    setSendError(null);
    setResyncingIds((prev) => new Set([...prev, ...checkinIds]));
    const errors: string[] = [];
    try {
      const rockdToken = getStoredRockdToken();
      if (!rockdToken) {
        throw new Error("Not logged in to Rockd. Please log in and try again.");
      }
      // One checkin at a time, as the sync itself goes
      for (const id of checkinIds) {
        try {
          const result = await resyncStrabospotPhotos(
            id,
            photoFailures.get(id) ?? null,
            rockdToken
          );
          const stillFailed = result.failed_photos.map((f) => f.photo_id);
          updatePhotoFailures((next) => {
            if (stillFailed.length === 0) next.delete(id);
            else next.set(id, stillFailed);
          });
          for (const f of result.failed_photos) {
            errors.push(`Checkin ${id}, photo ${f.photo_id}: ${f.message}`);
          }
        } catch (err: any) {
          errors.push(`Checkin ${id}: ${err?.message ?? "resync failed"}`);
        }
      }
    } catch (err: any) {
      errors.push(err?.message ?? "Failed to resync photos.");
    } finally {
      setResyncingIds((prev) => {
        const next = new Set(prev);
        for (const id of checkinIds) next.delete(id);
        return next;
      });
    }
    if (errors.length > 0) setSendError(errors.join("\n"));
  }

  function toggle(checkin: Checkin) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(checkin.checkin_id)) {
        next.delete(checkin.checkin_id);
      } else {
        next.set(checkin.checkin_id, checkin);
      }
      return next;
    });
  }

  function startSelectionMode() {
    setSendError(null);
    setSelectionMode(true);
  }

  function cancelSelectionMode() {
    setSelectionMode(false);
    setSelected(new Map());
    setSendError(null);
  }

  // The selection: new checkins are sent, already-sent ones resynced (a
  // resync carries their edits and any photos that didn't make it)
  async function handleBulkSend() {
    setIsSending(true);
    setSendError(null);
    setLastSentCount(null);
    setLastImageFailedIds([]);
    setLastFailedCheckins([]);
    try {
      await send([...selected.values()]);
      setSelected(new Map());
      setSelectionMode(false);
    } catch (err: any) {
      setSendError(err?.message ?? "Failed to send selected checkins.");
    } finally {
      setIsSending(false);
    }
  }

  let resyncCount = 0;
  for (const checkin of selected.values()) {
    if (isSent(checkin, localSentIds)) resyncCount += 1;
  }

  const photoFailedIds = [...photoFailures.keys()];

  const selection: StrabospotSelection = {
    isSynced: isStrabospotSynced,
    selectionMode,
    selected,
    sentIds: localSentIds,
    photoFailures,
    resyncingIds,
    toggle,
    resyncPhotos,
    syncedAt,
    resyncEdited,
  };

  return h(
    SelectionContext.Provider,
    { value: selection },
    h("div", { style: listLayoutStyle }, [
      // The signed-in user's checkins only; see `CheckinFeedPanel`'s mine feed
      h(MapCheckinFeed, {
        feed: {
          feedType: "mine",
          personId,
          token: getStoredRockdToken(),
        },
        itemComponent: StrabospotCheckinCard,
      }),
      h.if(isStrabospotSynced)(SelectionFooter, {
        selectionMode,
        selectedCount: selected.size,
        resyncCount,
        isSending,
        sendError,
        photoFailedIds,
        isResyncingFailures: resyncingIds.size > 0,
        onResyncFailures: () => resyncPhotos(photoFailedIds),
        onStart: startSelectionMode,
        onSend: handleBulkSend,
        onCancel: cancelSelectionMode,
      }),
      h(SendResultsDialog, {
        isOpen: showSuccessDialog,
        onClose: () => setShowSuccessDialog(false),
        sentCount: lastSentCount,
        imageFailedIds: lastImageFailedIds,
        failedCheckins: lastFailedCheckins,
      }),
    ])
  );
}

/** A checkin in the list. Outside selection mode a click shows it on the map;
 * in it, a click selects the checkin — to send it, or to send an edited one
 * again. */
function StrabospotCheckinContent({ data }: { data: Checkin }) {
  const selection = useSelection();
  const id = data.checkin_id;
  const sent = isSent(data, selection.sentIds);
  // Edited in Rockd after its last sync from this browser
  const edited =
    sent && editedSinceSync(data.updated, selection.syncedAt[String(id)]);
  const photosFailed = sent && selection.photoFailures.has(id);
  const selectable = selection.selectionMode;
  const isSelected = selectable && selection.selected.has(id);

  let onActivate: (() => void) | undefined = undefined;
  if (selectable) {
    onActivate = () => selection.toggle(data);
  }

  // What still needs sending, if anything: an edit (the whole checkin goes
  // again, photos included), or just the photos that failed
  let resyncRow = null;
  let flagTitle: string | null = null;
  if (edited) {
    flagTitle = "Edited since it was sent to StraboSpot";
    resyncRow = {
      label: "Edited since last sync",
      onResync: () => selection.resyncEdited([id]),
    };
  } else if (photosFailed) {
    flagTitle = "Sent to StraboSpot, but some photos didn't sync";
    resyncRow = {
      label: photoFailureLabel(selection.photoFailures.get(id) ?? null),
      onResync: () => selection.resyncPhotos([id]),
    };
  }

  // Sits after the star rating in the card's header row: ✓ once sent, or an
  // amber ! when it needs resyncing
  let badge = null;
  if (selection.isSynced && flagTitle != null) {
    badge = h(
      "div",
      { style: photoFailedBadgeStyle, title: flagTitle },
      h("span", { style: photoFailedBadgeMarkStyle }, "!")
    );
  } else if (selection.isSynced && sent) {
    badge = h(
      "div",
      { style: sentBadgeStyle, title: "Sent to StraboSpot" },
      h("span", { style: sentBadgeCheckStyle }, "✓")
    );
  }

  return h(MapCheckinCardBody, { data, onActivate, badge }, [
    h.if(selection.isSynced && resyncRow != null && !selection.selectionMode)(
      ResyncRow,
      {
        key: "resync",
        ...resyncRow,
        resyncing: selection.resyncingIds.has(id),
      }
    ),
    h.if(isSelected)("div", { key: "selected", style: selectedOverlayStyle }),
  ]);
}

function photoFailureLabel(photoIds: number[] | null) {
  if (photoIds == null) return "Its photos didn't sync";
  if (photoIds.length === 1) return "1 photo didn't sync";
  return `${photoIds.length} photos didn't sync`;
}

/** A sent checkin's prompt when it needs resyncing: what's out of date, and
 * Resync */
function ResyncRow({ label, resyncing, onResync }) {
  return h(
    "div",
    {
      style: photoFailedRowStyle,
      // A click here resyncs; it shouldn't also fly the map to the checkin
      onClick: (e) => e.stopPropagation(),
    },
    [
      h("span", label),
      h(
        Button,
        {
          small: true,
          icon: "refresh",
          loading: resyncing,
          onClick: onResync,
        },
        "Resync"
      ),
    ]
  );
}

const StrabospotCheckinCard = createMapCheckinCard(StrabospotCheckinContent);

function SelectionFooter({
  selectionMode,
  selectedCount,
  resyncCount,
  isSending,
  sendError,
  photoFailedIds,
  isResyncingFailures,
  onResyncFailures,
  onStart,
  onSend,
  onCancel,
}) {
  let selectedLabel = `${selectedCount} selected`;
  if (resyncCount > 0) {
    selectedLabel += ` (${resyncCount} already sent, to update)`;
  }

  let failuresLabel = `${photoFailedIds.length} checkins have photos that didn't sync to StraboSpot.`;
  if (photoFailedIds.length === 1) {
    failuresLabel = "1 checkin has photos that didn't sync to StraboSpot.";
  }

  return h("div", { style: selectionFooterStyle }, [
    // Photos that didn't make it, remembered across reloads, with one button
    // to send those checkins again
    h.if(!selectionMode && photoFailedIds.length > 0)(
      Callout,
      {
        intent: "warning",
        icon: "warning-sign",
        compact: true,
        style: { marginBottom: "0.5rem" },
      },
      [
        h("div", { style: { marginBottom: "0.4rem" } }, failuresLabel),
        h(
          Button,
          {
            small: true,
            icon: "refresh",
            loading: isResyncingFailures,
            onClick: onResyncFailures,
          },
          "Resync them"
        ),
      ]
    ),

    h.if(!selectionMode)(
      Button,
      {
        fill: true,
        onClick: onStart,
      },
      "Select checkins"
    ),

    h.if(selectionMode)([
      h(
        "div",
        {
          style: { marginBottom: "0.5rem", fontSize: "12px", opacity: 0.75 },
        },
        selectedLabel
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          },
        },
        [
          h(
            Button,
            {
              intent: "primary",
              disabled: selectedCount === 0 || isSending,
              loading: isSending,
              onClick: onSend,
            },
            "Send to Strabospot"
          ),
          h(
            Button,
            {
              minimal: true,
              disabled: isSending,
              onClick: onCancel,
            },
            "Cancel"
          ),
        ]
      ),
    ]),

    h.if(sendError != null)(
      "div",
      { style: { marginTop: "0.5rem" } },
      h(
        Callout,
        { intent: "danger", title: "Send failed" },
        h(
          "pre",
          { style: { whiteSpace: "pre-wrap", margin: 0, overflowX: "auto" } },
          sendError
        )
      )
    ),
  ]);
}

/** What a send did: how many went, any photos or checkins that didn't, and a
 * link to the StraboSpot dataset they went to. Blueprint's own dialog, card
 * and callouts, so it follows the theme like the site's other dialogs. */
function SendResultsDialog({
  isOpen,
  onClose,
  sentCount,
  imageFailedIds,
  failedCheckins,
}) {
  const datasetId = getStrabospotDatasetId();
  let fieldDataURL = "https://strabospot.org/fieldland/";
  if (datasetId != null) {
    fieldDataURL = `https://strabospot.org/StraboFieldDatasetDetail/?dataset_id=${datasetId}`;
  }

  let summary = `${sentCount ?? 0} checkins sent`;
  if (sentCount === 1) summary = "1 checkin sent";

  let text =
    "Your selected checkins were synced to StraboSpot and are now in your field data.";
  if (failedCheckins.length > 0 || imageFailedIds.length > 0) {
    text =
      "Some of your selected checkins didn't sync completely. See the details below.";
  }

  return h(
    Dialog,
    {
      isOpen,
      onClose,
      title: "Checkins sent to StraboSpot",
      // The logo alone, without the icon file's empty margin
      icon: s(
        "span.dialog-logo",
        s("img", { src: "/rockd-icon-256.png", alt: "Rockd" })
      ),
      canOutsideClickClose: true,
    },
    [
      h(
        DialogBody,
        s("div.results-body", [
          s("p.results-summary", summary),
          s("p.results-text", text),
          h.if(imageFailedIds.length > 0)(
            Callout,
            {
              intent: "warning",
              icon: "warning-sign",
              title: "Some photos didn't upload",
            },
            [
              h(
                "p",
                `The spot was saved, but photos failed for checkin ${imageFailedIds.join(
                  ", "
                )}.`
              ),
              "They're marked with an amber ! in the list; Resync sends just the photos that failed.",
            ]
          ),
          h.if(failedCheckins.length > 0)(
            Callout,
            {
              intent: "danger",
              icon: "error",
              title: "Some checkins didn't sync",
            },
            s(
              "ul.results-list",
              failedCheckins.map((item) =>
                h(
                  "li",
                  { key: item.checkinId },
                  `Checkin ${item.checkinId}: ${item.message}`
                )
              )
            )
          ),
          h(Card, { compact: true }, [
            s("div.next-step-label", "Next step"),
            s("div.next-step", [
              s("img.strabospot-logo", {
                src: STRABOSPOT_LOGO_URL,
                alt: "StraboSpot",
              }),
              h(
                AnchorButton,
                {
                  href: fieldDataURL,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  minimal: true,
                  rightIcon: "share",
                  intent: "primary",
                },
                "Open my field data"
              ),
            ]),
          ]),
        ])
      ),
      h(DialogFooter, {
        actions: h(Button, { intent: "primary", onClick: onClose }, "Done"),
      }),
    ]
  );
}
