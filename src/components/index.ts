import { DarkModeButton, useAPIResult } from "@macrostrat/ui-components";
import { AnchorButton, Button, Divider, Icon } from "@blueprintjs/core";
import { rockdApiOldURL, rockdApiURL, SETTINGS } from "~/settings";
import { useRef, useState } from "react";
import h from "./index.module.sass";

export function Footer() {
  const footerLinks1 = [
    { href: "/", icon: "home", text: "Home" },
    { href: "/explore", icon: "geosearch", text: "Explore" },
    { href: "/heatmap", icon: "map", text: "Heatmap" },
  ];

  const footerLinks2 = [
    { href: "/metrics", icon: "chart", text: "Metrics" },
    { href: "/terms", icon: "manual", text: "Terms and Conditions" },
    { href: "/privacy", icon: "lock", text: "Privacy" },
  ];

  return h("div.footer", [
    h("div.titles", [
      h(
        "a.footer-logo-link",
        {
          href: "/",
          onClick: (e) => {
            // If we're already on the homepage, scroll to top
            console.log(window.location.pathname);
            if (window.location.pathname == "/") {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }
          },
        },
        h(Image, {
          src: "main-page/rockd_transparent.png",
          className: "footer-logo",
          alt: "Logo",
        })
      ),
      h("p", [
        "Produced by ",
        h("a", { href: "https://macrostrat.org" }, "Macrostrat"),
      ]),
      h("p", [
        "Funded by ",
        h("a", { href: "https://nsf.gov" }, "NSF"),
        ", ",
        "the ",
        h("a", { href: "" }, "AAPG Foundation"),
        " and the ",
        h(
          "a",
          { href: "http://geoscience.wisc.edu/geoscience/" },
          "University of Wisconsin Department of Geoscience"
        ),
      ]),
    ]),
    h(
      "ul.footer-links",
      footerLinks1.map((props) => h(FooterLink, props))
    ),
    h(
      "ul.footer-links",
      footerLinks2.map((props) => h(FooterLink, props))
    ),
    h("div.controls", [
      h(DarkModeButton, {
        className: "dark-mode-button",
        showText: true,
        minimal: true,
      }),
    ]),
  ]);
}

function FooterLink({ href, icon, text }) {
  return h("li", h(AnchorButton, { href, icon, minimal: true }, text));
}

export function Image(props: ImageProps) {
  const { src, className, width, height, onClick, alt } = props;
  const [hasError, setHasError] = useState(false);
  const srcWithAddedPrefix =
    "https://storage.macrostrat.org/assets/rockd/" + src;

  if (!src || hasError) {
    return null;
  }

  return h("img", {
    src: srcWithAddedPrefix,
    className,
    width,
    height,
    onClick,
    onError: () => setHasError(true),
    alt,
  });
}

interface ImageProps {
  src: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
  alt?: string;
  onError?: () => void;
}

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

export function useRockdAPI(src) {
  return useAPIResult(apiURL + src);
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
        h("p", { className: "comment-author" }, name),
      ]),
      h("p", { className: "comment-text" }, comment),
      h("p", { className: "comment-date" }, created),
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

export function RockdSiteIcon({ className }) {
  return h(
    "a",
    { href: "/", className },
    h("img.rockd-icon", { src: "/rockd-icon-256.png" })
  );
}
