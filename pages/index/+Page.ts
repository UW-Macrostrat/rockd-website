import { Image, Footer } from "~/components";
import h from "./main.module.sass";
import { AnchorButton, Button } from "@blueprintjs/core";

function FullHeightContainer({
  children,
  className,
  showNextIndicator = true,
}) {
  return h("div.full-height-container", { className }, [
    children,
    h.if(showNextIndicator)("div.down-indicator-container", [
      h(
        Button,
        {
          className: "down-indicator",
          icon: "chevron-down",
          minimal: true,
          onClick: () => {
            const viewportHeight = window.innerHeight;
            const scrollHeight = window.scrollY;

            window.scrollTo({
              top: scrollHeight + viewportHeight,
              behavior: "smooth",
            });
          },
        },
        "Next page"
      ),
    ]),
  ]);
}

export function Page() {
  return h("div.main-page", [
    h(FullHeightContainer, [
      h("div.mask", [
        h(Image, {
          src: "main-page/field.jpg",
          className: "start-img back-img",
          alt: "Field",
        }),
      ]),
      h("div.main-content.side-by-side", [
        h("div.content-panel.app-info", [
          h(Image, {
            src: "main-page/rockd_transparent.png",
            className: "not-huge",
            alt: "Logo",
          }),
          h(
            "p.tagline",
            "Learn about, explore, and document the geologic world"
          ),
          h("div.download-buttons", [
            h(
              "a.ios-container",
              { href: "https://itunes.apple.com/us/app/id1153056624" },
              [
                h(Image, {
                  src: "main-page/appstore.png",
                  className: "download-badge ios",
                  alt: "App Store",
                }),
              ]
            ),
            h(
              "a.android-container",
              {
                href: "https://play.google.com/store/apps/details?id=org.macrostrat.rockd",
              },
              [
                h(Image, {
                  src: "main-page/google-play-badge.png",
                  className: "download-badge android",
                  alt: "Google Play",
                }),
              ]
            ),
          ]),
          h("p", [
            h(
              AnchorButton,
              {
                href: "/explore",
                className: "explore-link",
                large: true,
                minimal: true,
                icon: "geosearch",
              },
              "Explore the data"
            ),
          ]),
        ]),
        h(Image, {
          src: "main-page/main.png",
          className: "main-img",
          alt: "Main",
        }),
      ]),
    ]),
    h(FullHeightContainer, { className: "map-container" }, [
      h("div.map-images", [
        h(MapImage, {
          src: "main-page/grand_canyon.jpg",
          className: "map-shot grand_canyon",
        }),
        h(MapImage, {
          src: "main-page/new_zealand.jpg",
          className: "map-shot new_zealand",
        }),
        h(MapImage, {
          src: "main-page/world.jpg",
          className: "map-shot world",
        }),
        h(MapImage, {
          src: "main-page/appalachia.jpg",
          className: "map-shot appalachia",
        }),
      ]),
      h("div.map-info", [
        h("h1", [
          "Instant access to hundreds of ",
          h(
            "a",
            { href: "https://macrostrat.org/map/sources" },
            "geologic maps"
          ),
          " from around the world.",
        ]),
        h("p", [
          "Includes direct links to ",
          h("a", { href: "https://macrostrat.org" }, "Macrostrat"),
          " and ",
          h("a", { href: "https://xdd.wisc.edu" }, "xDD"),
          " (where available)",
        ]),
      ]),
    ]),
    h(FullHeightContainer, { className: "dashboard-container" }, [
      h("div.contents", [
        h("h1", "Curious what you're standing on?"),
        h(
          "p",
          "The Dashboard distills key facts about your location into a single, easy-to-read interface"
        ),
        h("div.dashboard-img-container", [
          h(Image, { src: "main-page/pilbara-australia.png" }),
          h(Image, { src: "main-page/huronian-supergroup.png" }),
          h(Image, { src: "main-page/copper-harbor.png" }),
          h(Image, { src: "main-page/appalachian-foreland.png" }),
          h(Image, { src: "main-page/gotthard-pass.png" }),
          h(Image, { src: "main-page/ozark-plateau.png" }),
          h(Image, { src: "main-page/eastern-australia.png" }),
        ]),
      ]),
    ]),
    h(FullHeightContainer, { className: "track-progress-container" }, [
      h(Image, {
        src: "main-page/red_rock.jpg",
        className: "back-img red-rock-img",
      }),

      h("div.img-container.row.row-eq-height", [
        h(Image, { src: "main-page/profile.png", className: "profile-img" }),
        h("div.map-info", [
          h(
            "h1",
            '"The best geologist is the one who has seen the most rocks"'
          ),
          h(
            "p",
            "Track your progress through the geologic rock record with summary statistics about your checkins"
          ),
        ]),
      ]),
    ]),
    h(FullHeightContainer, { showNextIndicator: false }, [
      h("div.contents", [
        h("h1", "Record your observations"),
        h(
          "p",
          "Rockd allows you to easily record your geological observations, using your location to provide spatially informed suggestions for nearby geologic units, time intervals, and fossils"
        ),

        h("div.image-grid", [
          h(
            ImageBlock,
            {
              src: "main-page/checkin.png",
            },
            h("span", "Take pictures of and rate features")
          ),

          h(
            ImageBlock,
            {
              src: "main-page/strat-names.png",
              className: "right",
            },
            h("span", "Tag stratigraphic names, even offline")
          ),

          h(
            ImageBlock,
            {
              src: "main-page/strike-dip.png",
            },
            h("span", "Use your phone's compass to record strike and dip")
          ),
          h(
            ImageBlock,
            {
              src: "main-page/taxa.png",
            },
            [
              h("span", "Search for and tag "),
              h(
                "a",
                { href: "https://paleobiodb.org" },
                "Paleobiology Database"
              ),
              h("span", " taxa."),
            ]
          ),
        ]),
      ]),
    ]),
    h(Footer),
  ]);
}

function MapImage({ src, className }) {
  return h("div.map-image", [
    h(Image, {
      src,
      className,
    }),
  ]);
}

function ImageBlock({ src, alt, className, children }) {
  return h("div.image-block", { className }, [
    h("div.image-container", [
      h(Image, {
        src,
        className: "record-block-img",
      }),
      h("div.caption", children),
    ]),
  ]);
}
