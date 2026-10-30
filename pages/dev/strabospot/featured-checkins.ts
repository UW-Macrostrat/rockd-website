import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
} from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { createContext, useContext, useState } from "react";
import {
  type Checkin,
  createMapCheckinCard,
  MapCheckinCardBody,
  MapCheckinFeed,
} from "~/components/checkin-feed";
import {
  sendCheckinsToStrabospotDataset,
  getStrabospotDatasetId,
} from "./strabospot-integration";
import { getStoredRockdToken } from "~/components/auth";

// The list fills the sidebar, with the selection controls under it
const listLayoutStyle = {
  display: "flex",
  flexDirection: "column" as const,
  flex: "1 1 auto",
  minHeight: 0,
};

const selectedOverlayStyle = {
  position: "absolute" as const,
  inset: 0,
  border: "2px solid #43b864",
  borderRadius: "10px",
  boxShadow: "inset 0 0 0 2px rgba(228,77,113,0.15)",
  pointerEvents: "none" as const,
};

const sentBadgeStyle = {
  position: "absolute" as const,
  top: "14px",
  right: "14px",
  width: "18px",
  height: "18px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 3,
  background: "linear-gradient(180deg, #7ee08f 0%, #43b864 100%)",
  border: "1px solid #379654",
  boxShadow:
    "inset 0 2px 4px rgba(16,53,29,0.2), inset 0 -1px 0 rgba(255,255,255,0.35), 0 1px 4px rgba(0,0,0,0.2)",
};

const sentBadgeCheckStyle = {
  color: "#245c35",
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

const successDialogStyle = {
  background: "#101923",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
  color: "#f3f6fb",
  overflow: "hidden",
};

const successDialogHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontWeight: 700,
  fontSize: "18px",
  color: "#f3f6fb",
};

const successDialogIconStyle = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #7ee08f 0%, #43b864 100%)",
  color: "#1d4d2d",
  fontWeight: 800,
  fontSize: "16px",
  boxShadow:
    "inset 0 1px 2px rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.25)",
};

const successDialogBodyStyle = {
  padding: "20px 24px 16px 24px",
  background: "#101923",
};

const successDialogTitleStyle = {
  margin: "0 0 10px 0",
  fontSize: "20px",
  fontWeight: 700,
  color: "#f3f6fb",
};

const successDialogTextStyle = {
  margin: 0,
  fontSize: "15px",
  lineHeight: 1.55,
  color: "rgba(243,246,251,0.88)",
};

const successDialogLinkCardStyle = {
  marginTop: "18px",
  padding: "14px 16px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
};

const successDialogLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "8px",
  color: "#7fb3ff",
  fontWeight: 700,
  fontSize: "15px",
  textDecoration: "none",
};

const successDialogFooterStyle = {
  padding: "14px 24px 20px 24px",
  background: "#101923",
  borderTop: "1px solid rgba(255,255,255,0.06)",
};

/** What each card needs to know about the selection, from the list around it */
interface StrabospotSelection {
  isSynced: boolean;
  selectionMode: boolean;
  selected: Map<number, Checkin>;
  sentIds: Set<number>;
  toggle(checkin: Checkin): void;
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
 * them to StraboSpot once the account is linked.
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

  if (personId == null) {
    return null;
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

  async function handleBulkSend() {
    setIsSending(true);
    setSendError(null);
    setLastSentCount(null);
    setLastImageFailedIds([]);
    setLastFailedCheckins([]);
    try {
      const selectedCheckins = [...selected.values()].filter(
        (checkin) => !isSent(checkin, localSentIds)
      );

      const rockdToken = getStoredRockdToken();
      if (!rockdToken) {
        throw new Error("Not logged in to Rockd. Please log in and try again.");
      }

      // Sends to StraboSpot and persists spot_id to the Rockd DB in one step.
      const response = await sendCheckinsToStrabospotDataset(
        selectedCheckins,
        rockdToken
      );

      const sentIds = response?.sentCheckinIds ?? [];
      const imageFailedIds = response?.imageFailedCheckinIds ?? [];
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
        for (const id of sentIds) next.add(Number(id));
        return next;
      });

      setSelected(new Map());
      setSelectionMode(false);
      setShowSuccessDialog(true);
    } catch (err: any) {
      setSendError(err?.message ?? "Failed to send selected checkins.");
    } finally {
      setIsSending(false);
    }
  }

  const selection: StrabospotSelection = {
    isSynced: isStrabospotSynced,
    selectionMode,
    selected,
    sentIds: localSentIds,
    toggle,
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
        isSending,
        sendError,
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
 * in it, a click selects an unsent checkin. */
function StrabospotCheckinContent({ data }: { data: Checkin }) {
  const selection = useSelection();
  const sent = isSent(data, selection.sentIds);
  const selectable = selection.selectionMode && !sent;
  const isSelected = selectable && selection.selected.has(data.checkin_id);

  let onActivate: (() => void) | undefined = undefined;
  if (selectable) {
    onActivate = () => selection.toggle(data);
  }

  return h(MapCheckinCardBody, { data, onActivate }, [
    h.if(selection.isSynced && sent)(
      "div",
      { style: sentBadgeStyle, title: "Sent to StraboSpot" },
      h("span", { style: sentBadgeCheckStyle }, "✓")
    ),
    h.if(isSelected)("div", { style: selectedOverlayStyle }),
  ]);
}

const StrabospotCheckinCard = createMapCheckinCard(StrabospotCheckinContent);

function SelectionFooter({
  selectionMode,
  selectedCount,
  isSending,
  sendError,
  onStart,
  onSend,
  onCancel,
}) {
  return h("div", { style: selectionFooterStyle }, [
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
        `${selectedCount} selected`
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

function SendResultsDialog({
  isOpen,
  onClose,
  sentCount,
  imageFailedIds,
  failedCheckins,
}) {
  const datasetId = getStrabospotDatasetId();

  return h(
    Dialog,
    {
      isOpen,
      onClose,
      title: h("div", { style: successDialogHeaderStyle }, [
        h("span", { style: successDialogIconStyle }, "✓"),
        h("span", "Checkins sent to StraboSpot"),
      ]),
      canOutsideClickClose: true,
      style: successDialogStyle,
    },
    [
      h(DialogBody, { style: successDialogBodyStyle }, [
        h(
          "p",
          { style: successDialogTitleStyle },
          `${sentCount ?? 0} checkin${sentCount === 1 ? "" : "s"} successfully sent`
        ),
        h(
          "p",
          { style: successDialogTextStyle },
          failedCheckins.length > 0 || imageFailedIds.length > 0
            ? "Some selected checkins were synced to StraboSpot. Review the details below for any issues."
            : "Your selected checkins were synced to StraboSpot and should now be available in your field data."
        ),
        h.if(imageFailedIds.length > 0)(
          "div",
          {
            style: {
              marginTop: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "rgba(255, 236, 204, 0.95)",
              fontSize: "14px",
              lineHeight: 1.5,
            },
          },
          [
            h(
              "div",
              { style: { fontWeight: 700, marginBottom: "6px" } },
              "Some photos could not be uploaded"
            ),
            h(
              "div",
              `Spot sync succeeded, but image upload failed for checkin${
                imageFailedIds.length === 1 ? "" : "s"
              }: ${imageFailedIds.join(", ")}`
            ),
          ]
        ),
        h.if(failedCheckins.length > 0)(
          "div",
          {
            style: {
              marginTop: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "rgba(255, 221, 221, 0.96)",
              fontSize: "14px",
              lineHeight: 1.5,
            },
          },
          [
            h(
              "div",
              { style: { fontWeight: 700, marginBottom: "6px" } },
              "Some checkins failed to sync"
            ),
            ...failedCheckins.map((item) =>
              h(
                "div",
                { style: { marginTop: "6px" } },
                `Checkin ${item.checkinId}: ${item.message}`
              )
            ),
          ]
        ),
        h("div", { style: successDialogLinkCardStyle }, [
          h(
            "div",
            {
              style: {
                fontSize: "13px",
                fontWeight: 600,
                color: "rgba(243,246,251,0.65)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              },
            },
            "Next step"
          ),
          h(
            "a",
            {
              href:
                datasetId != null
                  ? `https://strabospot.org/StraboFieldDatasetDetail/?dataset_id=${datasetId}`
                  : "https://strabospot.org/fieldland/",
              target: "_blank",
              rel: "noopener noreferrer",
              style: successDialogLinkStyle,
            },
            ["Open My Field Data", h("span", "↗")]
          ),
        ]),
      ]),
      h(DialogFooter, {
        style: successDialogFooterStyle,
        actions: [
          h(
            Button,
            {
              intent: "success",
              large: true,
              onClick: onClose,
            },
            "Done"
          ),
        ],
      }),
    ]
  );
}
