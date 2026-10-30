import { AnchorButton, Card, Icon, NonIdealState } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { type ReactNode, useEffect, useState } from "react";
import { navigate } from "vike/client/router";
import { useData } from "vike-react/useData";
import { usePageContext } from "vike-react/usePageContext";
import { getImageUrl, TruncatedText } from "~/components";
import {
  CheckinFooter,
  PersonByline,
  Rating,
} from "~/components/checkin-feed/checkin-card-parts";
import { ContentPage } from "~/layouts";
import "@macrostrat/data-components/dist/data-components.css";
import { ObservationDetails } from "#/checkin";
import styles from "./main.module.sass";

const h = hyper.styled(styles);

/**
 * One of a checkin's photos, large: a link back to its checkin and the
 * checkin's title above it; previous and
 * next, and a dot for each photo, below it (the arrow keys step through them
 * too); then what the photo shows — the observation's details, or, for the
 * checkin's own photo, the checkin as its card shows it.
 */
export function Page() {
  const { checkin } = useData<{ checkin: any }>();
  const photoID = Number(usePageContext().routeParams.id);

  let photos: number[] = [];
  if (checkin != null) photos = checkinPhotos(checkin);
  const index = Math.max(0, photos.indexOf(photoID));
  const prevHref = photoHref(photos[index - 1]);
  const nextHref = photoHref(photos[index + 1]);
  useArrowKeys(prevHref, nextHref);

  if (checkin == null) {
    return h(ContentPage, { title: "Photo" }, [
      h(NonIdealState, {
        icon: "media",
        title: "Photo not found",
        description: "This photo doesn't exist or has been deleted.",
      }),
    ]);
  }

  const observation = checkin.observations.find((o) => o.photo === photoID);

  let details: ReactNode = h(CheckinDetails, { checkin });
  if (observation != null) details = h(ObservationCard, { observation });

  return h(ContentPage, { title: "Photo" }, [
    h("div.photo-page", [
      h(
        AnchorButton,
        {
          href: `/checkin/${checkin.checkin_id}`,
          icon: "arrow-left",
          minimal: true,
          className: "checkin-link",
        },
        "Checkin"
      ),
      // The checkin's title over its photo, as its page heads it
      h("h1.photo-title", h(TruncatedText, { text: checkinTitle(checkin) })),
      h(PhotoFrame, {
        key: photoID,
        src: getImageUrl(checkin.person_id, photoID),
      }),
      h("div.photo-nav", [
        h(StepButton, { href: prevHref, icon: "arrow-left", label: "Previous" }),
        h(PhotoDots, { photos, index }),
        h(StepButton, { href: nextHref, icon: "arrow-right", label: "Next" }),
      ]),
      details,
    ]),
  ]);
}

/** The photo, as large as fits; an empty frame if it won't load */
function PhotoFrame({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  let content: ReactNode = h("img.photo-image", {
    src,
    alt: "Checkin photo",
    onError: () => setFailed(true),
  });
  if (failed) {
    content = h("div.photo-missing", [
      h(Icon, { icon: "media", size: 32 }),
      h("span", "This photo couldn't be loaded"),
    ]);
  }

  return h("div.photo-frame", content);
}

/** Previous or next; held in place (disabled) at either end */
function StepButton({ href, icon, label }) {
  return h(AnchorButton, {
    href: href ?? undefined,
    disabled: href == null,
    icon,
    minimal: true,
    large: true,
    title: label,
    "aria-label": label,
  });
}

/** A dot for each of the checkin's photos, each a link to it, the current one
 * filled; and where this one falls ("3 of 11") */
function PhotoDots({ photos, index }: { photos: number[]; index: number }) {
  const dots = photos.map((photo, i) => {
    const label = `Photo ${i + 1} of ${photos.length}`;
    if (i === index) {
      return h("span.photo-dot.current", {
        key: photo,
        "aria-current": "true",
        "aria-label": label,
      });
    }
    return h("a.photo-dot", {
      key: photo,
      href: photoHref(photo),
      title: label,
      "aria-label": label,
    });
  });

  return h("div.photo-dots-group", [
    h("nav.photo-dots", { "aria-label": "Photos" }, dots),
    h("span.photo-counter", `${index + 1} of ${photos.length}`),
  ]);
}

/** What an observation's photo shows, as the checkin page's observation cards
 * show it */
function ObservationCard({ observation }) {
  const details = h(ObservationDetails, { observation });
  return h(Card, { className: "photo-details" }, [
    h("h3.details-title", "Observation"),
    details ?? h("p.details-empty", "No details were recorded."),
  ]);
}

/** The checkin's own photo: the checkin as its card shows it */
function CheckinDetails({ checkin }) {
  const notes = checkin.notes?.trim();
  return h(Card, { className: "photo-details checkin-details" }, [
    h(
      PersonByline,
      {
        personId: checkin.person_id,
        name: `${checkin.first_name} ${checkin.last_name}`,
        date: checkin.created,
      },
      h(Rating, { value: checkin.rating })
    ),
    h.if(Boolean(notes))("p.checkin-notes", notes),
    h(CheckinFooter, { data: checkin }),
  ]);
}

/** The checkin's photos in order: its own, then each observation's */
function checkinPhotos(checkin): number[] {
  const photos = [checkin.photo, ...checkin.observations.map((o) => o.photo)];
  return photos.filter((photo) => photo != null);
}

function photoHref(photo: number | undefined): string | null {
  if (photo == null) return null;
  return `/photo/${photo}`;
}

/** The checkin's title, as its page heads it (its notes' first line) */
function checkinTitle(checkin): string {
  const first = (checkin.notes ?? "").trim().split(/\n+/)[0]?.trim();
  if (first) return first;
  return "Checkin";
}

/** The left and right arrow keys step to the previous and next photo */
function useArrowKeys(prevHref: string | null, nextHref: string | null) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowLeft" && prevHref != null) navigate(prevHref);
      if (event.key === "ArrowRight" && nextHref != null) navigate(nextHref);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevHref, nextHref]);
}
