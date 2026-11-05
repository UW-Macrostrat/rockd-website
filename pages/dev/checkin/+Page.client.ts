import { AnchorButton } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { DraftsList } from "~/components/checkin-editor";
import styles from "~/components/checkin-editor/checkin-editor.module.sass";

const h = hyper.styled(styles);

/** `/dev/checkin` — the editor's front door: start a checkin, and pick up
 * any edits kept in this browser (the app's "Unsynced" feed). Laid out as
 * `/orgs` is: a title, then the introduction with its actions at the right. */
export function Page() {
  return h("div.checkins-index", [
    h("h1.index-title", "Checkins"),
    h("div.index-intro-row", [
      h(
        "p.index-intro",
        "Create a checkin, or pick up edits kept in this browser."
      ),
      h("div.index-actions", [
        h(
          AnchorButton,
          { href: "/dev/feed/mine", icon: "feed" },
          "Your checkins"
        ),
        h(
          AnchorButton,
          { href: "/dev/checkin/new", intent: "primary", icon: "add" },
          "New checkin"
        ),
      ]),
    ]),
    h("h2.section-title", "Unsaved edits"),
    h(DraftsList),
  ]);
}
