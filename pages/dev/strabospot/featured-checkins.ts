import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
  Spinner,
} from "@blueprintjs/core";
import { useEffect, useState } from "react";
import h from "../../explore/main.module.sass";
import { PageCarousel, fetchRockdData } from "~/components";
import { createCheckins } from "~/components/checkin.client";
import { useAsyncMemo } from "@macrostrat/ui-components";
import { useMapRef } from "@macrostrat/mapbox-react";
import {
  getDatasetSpotIds,
  sendCheckinsToStrabospotDataset,
} from "./strabospot-integration";

const selectionCardStyle = {
  position: "relative" as const,
  marginBottom: "1rem",
  borderRadius: "10px",
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
  position: "sticky" as const,
  bottom: 0,
  background: "var(--panel-background-color, white)",
  paddingTop: "0.75rem",
  paddingBottom: "0.5rem",
  borderTop: "1px solid var(--panel-rule-color, #ddd)",
  marginTop: "0.5rem",
};

export function FeatureDetails({
  setInspectPosition,
  isStrabospotSynced,
  personId,
}) {
  const [page, setPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sentIdsState, setSentIdsState] = useState<Set<number>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResponse, setSendResponse] = useState<any>(null);
  const mapRef = useMapRef();
  const [lastSentCount, setLastSentCount] = useState<number | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [result, nextData] = useRockdCheckins(page, personId);

  const fetchedSentIds = useAsyncMemo(async () => {
    if (!isStrabospotSynced) return new Set<number>();
    return await getDatasetSpotIds();
  }, [isStrabospotSynced]);

  useEffect(() => {
    if (fetchedSentIds != null) {
      setSentIdsState(new Set(fetchedSentIds));
    } else if (!isStrabospotSynced) {
      setSentIdsState(new Set());
    }
  }, [fetchedSentIds, isStrabospotSynced]);

  const safeResult = result ?? [];

  const sorted = [...safeResult].sort((a, b) => {
    if (a.photo === null && b.photo !== null) return 1;
    if (a.photo !== null && b.photo === null) return -1;
    return 0;
  });

  const selectableCheckins = sorted.filter((checkin) => {
    const checkinId = Number(checkin.checkin_id ?? checkin.id);
    return !sentIdsState.has(checkinId);
  });

  if (personId == null) {
    return null;
  }

  if (result == null) {
    return h(Spinner, { className: "loading-spinner" });
  }

  if (result.length === 0) {
    return h("div.checkin-container", [
      h("p", `No checkins found for person_id=${personId}`),
    ]);
  }

  const pages = PageCarousel({
    page,
    setPage,
    nextData,
  });

  function toggleSelected(checkinId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(checkinId)) {
        next.delete(checkinId);
      } else {
        next.add(checkinId);
      }
      return next;
    });
  }

  function startSelectionMode() {
    setSendError(null);
    setSendResponse(null);
    setSelectionMode(true);
  }

  function cancelSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setSendError(null);
  }

  async function handleBulkSend() {
    setIsSending(true);
    setSendError(null);
    setSendResponse(null);
    setLastSentCount(null);

    try {
      const selectedCheckins = selectableCheckins.filter((checkin) =>
        selectedIds.has(Number(checkin.checkin_id ?? checkin.id))
      );
      const sentCount = selectedCheckins.length;
      const response = await sendCheckinsToStrabospotDataset(selectedCheckins);
      setSendResponse(response);
      setLastSentCount(sentCount);

      const refreshedSentIds = await getDatasetSpotIds();
      setSentIdsState(new Set(refreshedSentIds));

      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowSuccessDialog(true);
    } catch (err: any) {
      setSendError(err?.message ?? "Failed to send selected checkins.");
    } finally {
      setIsSending(false);
    }
  }

  const checkinCards = sorted.map((checkin) => {
    const tile = createCheckins([checkin], mapRef, setInspectPosition);
    const checkinId = Number(checkin.checkin_id ?? checkin.id);
    const alreadySent = sentIdsState.has(checkinId);
    const selected = selectedIds.has(checkinId);
    const selectable = selectionMode && !alreadySent;

    return h(
      "div",
      {
        key: checkin.checkin_id ?? checkin.id,
        style: selectionCardStyle,
        onClick: selectable ? () => toggleSelected(checkinId) : undefined,
      },
      [
        tile,
        h.if(alreadySent)(
          "div",
          {
            style: sentBadgeStyle,
            title: "Sent to StraboSpot",
          },
          h("span", { style: sentBadgeCheckStyle }, "✓")
        ),
        h.if(selectable && selected)("div", { style: selectedOverlayStyle }),
      ]
    );
  });

  return h("div.checkin-container", [
    checkinCards,
    pages,

    h.if(isStrabospotSynced)("div", { style: selectionFooterStyle }, [
      h.if(!selectionMode)(
        Button,
        {
          fill: true,
          onClick: startSelectionMode,
        },
        "Select checkins"
      ),

      h.if(selectionMode)([
        h(
          "div",
          {
            style: { marginBottom: "0.5rem", fontSize: "12px", opacity: 0.75 },
          },
          `${selectedIds.size} selected`
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
                disabled: selectedIds.size === 0 || isSending,
                loading: isSending,
                onClick: handleBulkSend,
              },
              "Send to Strabospot"
            ),
            h(
              Button,
              {
                minimal: true,
                disabled: isSending,
                onClick: cancelSelectionMode,
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
      h(
        Dialog,
        {
          isOpen: showSuccessDialog,
          onClose: () => setShowSuccessDialog(false),
          title: "Checkins sent to StraboSpot",
          canOutsideClickClose: true,
        },
        [
          h(DialogBody, [
            h(
              "p",
              { style: { marginTop: 0 } },
              `${lastSentCount ?? 0} checkin${
                lastSentCount === 1 ? "" : "s"
              } successfully sent.`
            ),
            h("p", "You can view your spots here:"),
            h(
              "a",
              {
                href: "https://strabospot.org/my_field_data",
                target: "_blank",
                rel: "noopener noreferrer",
                style: {
                  color: "#2d6cdf",
                  fontWeight: 600,
                  textDecoration: "none",
                },
              },
              "Open My Field Data"
            ),
          ]),
          h(DialogFooter, {
            actions: [
              h(
                Button,
                {
                  intent: "success",
                  onClick: () => setShowSuccessDialog(false),
                },
                "Done"
              ),
            ],
          }),
        ]
      ),
    ]),
  ]);
}

function useRockdCheckins(page: number, personId: number) {
  const result = useAsyncMemo(async () => {
    return await fetchRockdCheckins(page, personId);
  }, [page, personId]);

  const next = useAsyncMemo(async () => {
    return await fetchRockdCheckins(page + 1, personId);
  }, [page, personId]);

  return [result, next];
}

async function fetchRockdCheckins(page: number, personId: number) {
  const res = await fetchRockdData(
    `/protected/checkins?person_id=${personId}&page=${page}`
  );
  const json = await res.json();
  return json?.success?.data ?? [];
}
