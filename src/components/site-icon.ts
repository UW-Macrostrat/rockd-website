import h from "@macrostrat/hyper";

/** The Rockd app icon, linking home. */
export function RockdSiteIcon({ className }: { className?: string }) {
  return h(
    "a",
    { href: "/", className },
    h("img.rockd-icon", { src: "/rockd-icon-256.png", alt: "Rockd home" })
  );
}
