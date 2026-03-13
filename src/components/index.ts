import h from "./index.module.sass";
import { DarkModeButton, useAPIResult, useDarkMode } from "@macrostrat/ui-components";
import { Divider, Icon } from "@blueprintjs/core";
import { rockdApiOldURL, rockdApiURL, SETTINGS } from "~/settings";
import { useState } from "react";

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
      h("h3.footer-text.upper", [
        "Produced by the ",
        h("a", { href: "https://macrostrat.org" }, "UW Macrostrat Lab"),
      ]),
      h("h3.footer-text.lower", [
        "Funded by ",
        h("a", { href: "https://nsf.gov" }, "NSF"),
        " and ",
        h(
          "a",
          { href: "http://geoscience.wisc.edu/geoscience/" },
          "UW Geoscience"
        ),
      ]),
    ]),
    h("div.footer-links", [
      h(
        "ul",
        footerLinks1.map((props) => h(FooterLink, props))
      ),
      h(
        "ul",
        footerLinks2.map((props) => h(FooterLink, props))
      ),
    ]),
    h("div.dark-mode", [
      h(DarkModeButton, { className: "dark-mode-button", showText: true }),
    ]),
  ]);
}

function FooterLink({ href, icon, text }) {
  const isDarkMode = useDarkMode().isEnabled;

  return h(
    "li",
    {
      onClick: (e) => {
        e.preventDefault();
        window.open(href, "_self");
      },
    },
    [
      h(Icon, {
        className: "footer-icon",
        icon,
        style: { color: isDarkMode ? "black" : "white" },
      }),
      h("p", text),
    ]
  );
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

export function pageCarousel({ page, setPage, nextData }) {
  return h(
    "div.pages",
    h("div.page-container", [
      h("div", { className: "page-btn" }, [
        h(
          "div",
          {
            className: page != 1 ? "btn-content" : "hide",
            onClick: () => {
              setPage(page - 1);
            },
          },
          [h(Icon, { icon: "arrow-left" }), h("p", "Previous")]
        ),
      ]),
      h("p", "Page " + page),
      h("div", { className: "page-btn" }, [
        h(
          "div",
          {
            className:
              nextData && nextData?.length > 0 ? "btn-content" : "hide",
            onClick: () => {
              setPage(page + 1);
            },
          },
          [h("p", "Next"), h(Icon, { icon: "arrow-right" })]
        ),
      ]),
    ])
  );
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
