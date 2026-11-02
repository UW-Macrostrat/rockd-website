import { AnchorButton } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { DraftsList } from "~/components/checkin-editor";
import styles from "~/components/checkin-editor/checkin-editor.module.sass";

const h = hyper.styled(styles);

/** `/dev/checkin` — the editor's front door: start a checkin, and pick up
 * any edits kept in this browser (the app's "Unsynced" feed). */
export function Page() {
  return h("div.checkins-index", [
    h("div.index-actions", [
      h(
        AnchorButton,
        { href: "/dev/checkin/new", intent: "primary", icon: "add" },
        "New checkin"
      ),
      h(
        AnchorButton,
        { href: "/dev/feed/mine", icon: "feed" },
        "Your checkins"
      ),
    ]),
    h("h2.section-title", "Unsaved edits"),
    h(DraftsList),
  ]);
}
