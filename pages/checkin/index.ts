import { Card, Icon } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { type ComponentType, useEffect, useState } from "react";
import { Comments, getImageUrl, TruncatedText } from "~/components";
import {
  CheckinFooter,
  PersonByline,
  Rating,
  ReservedImage,
} from "~/components/checkin-feed/checkin-card-parts";
import { ContentPage } from "~/layouts";
import "@macrostrat/data-components/dist/data-components.css";
import {
  hasObservationContent,
  ObservationCard,
  ObservationDetails,
} from "./observation";
import styles from "./main.module.sass";

const h = hyper.styled(styles);

export { ObservationDetails };

/**
 * A checkin's page, under the site header ("Rockd › Checkin"): its title,
 * then the checkin as the cards show it (who and when, rating, description,
 * photo, place and counts) beside a map of where it is, its observations as
 * cards, and its comments.
 */
export function Checkins({ checkin, comments }) {
  if (checkin === undefined) {
    return h(ContentPage, { title: "Checkin" }, [
      h("p", "This checkin does not exist or has been deleted."),
    ]);
  }

  const { title, description } = splitNotes(checkin.notes);
  const observations = checkin.observations.filter(hasObservationContent);

  return h(ContentPage, { title: "Checkin" }, [
    h("div.checkin-page", [
      // A long title is cut short, with a "…" that shows it all
      h("h1.checkin-title", h(TruncatedText, { text: title })),
      // The two cards share rows, so the map matches the photo's size and place
      h("div.checkin-overview", [
        h(CheckinSummary, { checkin, description }),
        h(Card, { className: "checkin-location" }, [
          h("div.location-header", [
            h(Icon, { icon: "map-marker", size: 14 }),
            h("span", "Location"),
          ]),
          h(
            "div.location-media",
            h(LocationMap, {
              position: { lng: checkin.lng, lat: checkin.lat },
            })
          ),
        ]),
      ]),
      h.if(observations.length > 0)("section.checkin-section", [
        h("h2.section-title", `Observations (${observations.length})`),
        h(
          "div.observation-grid",
          observations.map((observation) =>
            h(ObservationCard, {
              key: observation.obs_id,
              observation,
              personId: checkin.person_id,
            })
          )
        ),
      ]),
      h.if(comments?.length > 0)("section.checkin-section", [
        h("h2.section-title", `Comments (${comments?.length})`),
        h(Card, { className: "comments-card" }, h(Comments, { comments })),
      ]),
    ]),
  ]);
}

/** The checkin as its card shows it — byline and rating, then its
 * description and photo (opening the photo page), then its place and counts —
 * with the title lifted out to the page's heading. */
function CheckinSummary({ checkin, description }) {
  let photo = null;
  if (checkin.photo != null) {
    photo = h(
      "a.summary-photo-link",
      { href: `/photo/${checkin.photo}` },
      h(ReservedImage, {
        className: "checkin-photo",
        src: getImageUrl(checkin.person_id, checkin.photo),
        alt: checkin.notes ?? "Checkin photo",
      })
    );
  }

  // Each piece in its own row of the overview's shared rows
  return h(Card, { className: "checkin-summary" }, [
    h(
      "div.summary-header",
      h(
        PersonByline,
        {
          personId: checkin.person_id,
          name: `${checkin.first_name} ${checkin.last_name}`,
          date: checkin.created,
        },
        h(Rating, { value: checkin.rating })
      )
    ),
    h.if(description != null)("p.checkin-description", description),
    h.if(photo != null)("div.summary-media", photo),
    h("div.summary-footer", h(CheckinFooter, { data: checkin })),
  ]);
}

/** Where the checkin is: the map pages' map, loaded in the browser only (a
 * placeholder holds its place until then, and on the server) */
function LocationMap(props: { position: { lng: number; lat: number } }) {
  const Map = useBrowserComponent(loadLocationMap);
  if (Map == null) return h("div.location-map-placeholder");
  return h(Map, { ...props, className: "checkin-map" });
}

const loadLocationMap = () =>
  import("~/components/map-sidebar/location-map").then(
    (module) => module.LocationMap
  );

/** A component loaded once the page is in the browser; null until then.
 * (vike-react's `ClientOnly` relies on its JSX children being stripped from
 * the server build, which hyperscript children aren't.) */
function useBrowserComponent<P>(
  load: () => Promise<ComponentType<P>>
): ComponentType<P> | null {
  const [component, setComponent] = useState<ComponentType<P> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then((loaded) => {
      if (!cancelled) setComponent(() => loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return component;
}

/** A checkin's notes as a title (the first line) and a description (the
 * rest), since the one field carries both */
function splitNotes(notes: string | null): {
  title: string;
  description: string | null;
} {
  const [first, ...rest] = (notes ?? "").trim().split(/\n+/);
  let title = first?.trim();
  if (!title) title = "Untitled checkin";
  let description: string | null = rest.join("\n").trim();
  if (description === "") description = null;
  return { title, description };
}
