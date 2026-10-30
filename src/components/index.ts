import { useAPIResult } from "@macrostrat/ui-components";
import { Button, Divider, Icon } from "@blueprintjs/core";
import {
  rockdApiOldURL,
  rockdApiURL,
  macrostratEnv,
  SETTINGS,
} from "~/settings";
import { useState } from "react";
import h from "./index.module.sass";
import { Image, type ImageProps } from "./image";

export { Image };
export type { ImageProps };
export * from "./footer";
export * from "./theme-button";
export * from "./navigation";
export * from "./site-icon";
// `./map-sidebar` loads Mapbox through map-interface, so map pages import it
// directly rather than every server-rendered page pulling it in from here

export function TestImage({ src, onError, onLoad }) {
  return h("img", {
    src,
    onError,
    onLoad,
  });
}

export function BlankImage(props: ImageProps) {
  const { src, className, width, height, onClick, alt } = props;
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return null;
  }

  return h("img", {
    src,
    className,
    width,
    height,
    onClick,
    onError: () => setHasError(true),
    alt,
  });
}

// remove when metrics works
const apiURL = SETTINGS.rockdApiURL; // new route

export async function fetchRockdData(url: string) {
  return await fetch(apiURL + url);
}

/** A Rockd API route's response; a null route makes no request. */
export function useRockdAPI(src: string | null) {
  let route: string | null = null;
  if (src != null) route = apiURL + src;
  return useAPIResult(route);
}

function imageExists(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = Image({ src });

    img.onload = () => resolve(true); // No error
    img.onerror = () => resolve(false); // Error occurred
  });
}

export function getImageUrl(person_id, photo_id) {
  return apiURL + "/protected/image/" + person_id + "/thumb_large/" + photo_id;
}

export function getProfilePicUrl(person_id) {
  return apiURL + "/protected/gravatar/" + person_id;
}

export function PageCarousel({ page, setPage, nextData }) {
  return h("div.page-carousel", [
    h(
      Button,
      {
        icon: "arrow-left",
        minimal: true,
        className: page != 1 ? "page-btn" : "hide",
        onClick: () => setPage(page - 1),
      },
      "Previous"
    ),
    h("span.page-number", "Page " + page),
    h(
      Button,
      {
        rightIcon: "arrow-right",
        minimal: true,
        className: nextData && nextData?.length > 0 ? "page-btn" : "hide",
        onClick: () => setPage(page + 1),
      },
      "Next"
    ),
  ]);
}

export async function fetchAPIData(url) {
  console.log("Fetching data from:", rockdApiURL + url);
  return fetch(rockdApiURL + url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      throw error;
    });
}

export function fetchAPIDataOld(url) {
  return fetch(rockdApiOldURL + url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      throw error;
    });
}

export function Comments({ comments }) {
  const commentArr = [];

  comments.forEach((item, index) => {
    const { created, comment, person_id, name, likes } = item;

    const commentNode = h("div.comment", [
      h("div.comment-author", [
        h(BlankImage, {
          className: "comment-pic",
          src: getProfilePicUrl(person_id),
          alt: "profile picture",
        }),
        h("div.comment-meta", [
          h("h3", { className: "comment-author" }, name),
          h("p", { className: "comment-date" }, created),
        ]),
      ]),
      h("p", { className: "comment-text" }, comment),
      h("div.comment-likes", [
        h(Icon, { icon: "thumbs-up", className: "like-icon" }),
        h("p", { className: "comment-likes" }, String(likes)),
      ]),
    ]);

    commentArr.push(commentNode);

    // Add divider between comments (but not after the last one)
    if (index < comments.length - 1) {
      commentArr.push(h(Divider));
    }
  });

  return h("div.comments", [...commentArr]);
}
