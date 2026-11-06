import { AnchorButton } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import { DraftsList } from "~/components/checkin-editor";
import styles from "~/components/checkin-editor/checkin-editor.module.sass";

const h = hyper.styled(styles);

/** `/dev/create-edit-checkin` — the editor's front door: start a checkin, and pick up
 * any edits kept in this browser (the app's "Unsynced" feed). Laid out as
 * `/orgs` is: a title, then the introduction with its actions at the right. */
export function Page() {
  return h("div.checkins-index", [
    h("h1.index-title", "Edit checkins"),
    h("div.index-intro-row", [
      h("p.index-intro", "Create a new checkin or edit an existing one."),
      h("div.index-actions", [
        h(
          AnchorButton,
          {
            href: "/dev/create-edit-checkin/new",
            intent: "primary",
            icon: "add",
          },
          "New checkin"
        ),
        h(AnchorButton, { href: "/dev/feed/mine", icon: "feed" }, "My feed"),
      ]),
    ]),
    h(DraftsList),
  ]);
}
