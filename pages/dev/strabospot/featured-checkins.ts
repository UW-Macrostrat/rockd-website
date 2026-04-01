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
import { sendCheckinsToStrabospotDataset } from "./strabospot-integration";
import { getStoredRockdToken } from "../../login/rockd-auth";
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

export function FeatureDetails({
  setInspectPosition,
  isStrabospotSynced,
  personId,
}) {
  const [page, setPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  //Tracks checkin IDs that were sent to StraboSpot in this session so the
  // badge appears immediately without waiting for the next API refetch.
  const [localSentIds, setLocalSentIds] = useState<Set<number>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const mapRef = useMapRef();
  const [lastSentCount, setLastSentCount] = useState<number | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [result, nextData] = useRockdCheckins(page, personId);

  const safeResult = result ?? [];

  const sorted = [...safeResult].sort((a, b) => {
    if (a.photo === null && b.photo !== null) return 1;
    if (a.photo !== null && b.photo === null) return -1;
    return 0;
  });

  // A checkin is considered sent if the DB already has a spot_id for it
  //checkin.spot_id != null or if we sent it during this session.
  const selectableCheckins = sorted.filter((checkin) => {
    const checkinId = Number(checkin.checkin_id ?? checkin.id);
    return checkin.spot_id == null && !localSentIds.has(checkinId);
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
    setLastSentCount(null);

    try {
      const selectedCheckins = selectableCheckins.filter((checkin) =>
        selectedIds.has(Number(checkin.checkin_id ?? checkin.id))
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

      // Update local state so badges appear immediately without a refetch.
      setLastSentCount(sentIds.length);
      setLocalSentIds((prev) => {
        const next = new Set(prev);
        for (const id of sentIds) next.add(Number(id));
        return next;
      });

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
    const alreadySent =
      isStrabospotSynced &&
      (checkin.spot_id != null || localSentIds.has(checkinId));
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
              `${lastSentCount ?? 0} checkin${
                lastSentCount === 1 ? "" : "s"
              } successfully sent`
            ),
            h(
              "p",
              { style: successDialogTextStyle },
              "Your selected checkins were synced to StraboSpot and should now be available in your field data."
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
                  href: "https://strabospot.org/my_field_data",
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
